# Moda NFT Visualiser

This project is forked from a Code on Canvas repository.
Code On Canvas Origin: `git@bitbucket.org:codeoncanvas/moda-genesis-nft.git`

## Getting started

- Run `yarn` (same folder as this README.md) to install the dependencies
- Run `yarn build` to build the moda-visualiser library.

## Publishing Packages

- Grab a token from GitHub with permissions to read / write to repos
- Set this token in your zshrc or bash_profile: `export MODA_PACKAGE_TOKEN=<secret>`
- Increment the version in the package.json (duplicate versions are not allowed)
- Run `npm publish`
- Be sure to periodically delete older unused versions inside the GitHub account

## How to use

### Updating the packages

1. Make changes to the repository and push to main
2. Increment the package version numbers
3. [Go to the releases page](https://github.com/modadao/moda-visualiser/releases).
4. Create a new release
5. [Verify release workflow status](https://github.com/modadao/moda-visualiser/actions)

### Example integration

The visualiser needs to be constructed on mount (here via a `useEffect` hook) and disposed on unmount.
This is because the visualiser will create a lot of GPU resources + add event
listeners that will need to be disposed at the end of the lifecycle.

```javascript
import ModaVisualiser, { DefaultVisuals } from '@moda/visualiser';

function Visualiser() {
  // Mount/dispose and remove visualiser on mount/unmount
  const container = useRef(null);
  const visualiser = useRef<ModaVisualiser>();
  useEffect(() => {
    if (container.current) {
      visualiser.current = new ModaVisualiser(container.current, DefaultVisuals);
    }
    return () => {
      if (visualiser.current) {
        visualiser.current.dispose();
        visualiser.current = null;
      }
    }
  }, [])

  return(
    <div ref={container}> </div>
  )
}
```


### Lazy Loading
The Moda Visualiser has a large bundle size (due to threejs) and depends on client side APIs and thus should be lazyloaded/codesplit using dynamic components.

```javascript
const Visualiser = dynamic(() => import('../components/Visualiser'), { ssr: false })

function App() {
  return (
    <div className="App">
    { typeof window !== 'undefined' &&
      <Visualiser />
    }
    </div>
  )
}
```

### Loading a fingerprint

The visualiser is not responsible for loading fingerprints,
to visualise/play a fingerprint you must first pre-fetch the fingerprint.


```typescript
const response = await fetch(`${API_ENDPOINT}?id=xxx&address=xxxx);
const fingerprint = await response.json();

const audio_path = '...';

visualiser.current.updateFingerprint(fingerprint, audio_path)
```

### Event listeners + showing loading state

There are some events you can hook into to provide feedback to the user.
These events are `play`|`pause`|`loading`|`loaded`.

- `play` : Triggers after `updateFingerprint` is complete and autoplay starts or when `play()` method is run.
- `pause` : Triggers when `pause()` method is run.
- `loading` : Triggers at the start of `updateFingerprint`
- `loaded` : Triggers once `updateFingerprint` is complete and visualiser is ready to play (triggers before `play`).

```typescript
  const container = useRef(null);
  const visualiser = useRef<ModaVisualiser>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (container.current) {
      visualiser.current = new ModaVisualiser(container.current, DefaultVisuals);
      visualiser.current.addEventListener('loading', () => setIsLoading(true););
      visualiser.current.addEventListener('loaded', () => setIsLoading(false););
    }
    return () => {
      if (visualiser.current) {
        visualiser.current.dispose();
        visualiser.current = null;
      }
    }
```

### Implementing custom visuals

Implement custom visuals by passing the implementation of the visuals to the ModaVisualiser.  You can create custom visuals using the following code block.

```typescript
import { Object3D, OrthographicCamera, WebGLRenderer } from 'three';
import { IVisuals, IDerivedFingerPrint, IAudioFrame } from '@moda/visualiser';

export default class CustomVisuals extends Object3D implements IVisuals {
  paused = false; // Flag to play and pause the visuals

  constructor(
    private camera: OrthographicCamera,
    renderer: WebGLRenderer,
    private fingerprint: IDerivedFingerPrint
  ) {
    super();
    this.axes = new AxesHelper(1);
    this.add(this.axes); // Scene elements should be added to self
  }

  // Update function runs once per frame.
  update(elapsed: number, delta: number) {
    if (paused) return;
    this.axes.rotateY(delta * 5); // Rotate axes at a consistent speed
  }

  // Handle audio is run once every frame after update.  This is where you add the audio reactivity.
  handleAudio(frame: IAudioFrame) {
    if (paused) return;
    this.axes.position.y = frame.power; // Move axes up and down
  }

  // Dispose function is run on unmount/when switching fingerprint or settings.
  // It is required to cleanup GPU resources, event listeners etc.
  dispose() {
    this.axes.dispose();
  }
}

visualiser.current = new ModaVisualiser(container.current, CustomVisuals);
```

#### Extra helpers

##### `FFTTextureManager.ts`

This is a helper function that encodes some FFT data in a data texture to be used inside shaders.

```typescript
const fftTTextureManager = new FFTTextureManager({
  textureSize: 256,
});

const fftTexture = fftTTextureManager.dataTexture; // This is the texture object that can be bound to a shader

// Inside of handleAudio function
// The FFTTextureManager will update dataTexture each frame (no need to rebind).
fFTTextureManager.handleAudio(frame);
```

Usage inside shader
```glsl
// vert shader
uniform sampler2D u_fftTexture;

attribute float alpha; // (Scales from 0 - 1)

void main() {
  vec4 c = texture2D(u_fftTexture, vec2(alpha, 0.5));
  float fftBandPower = c.r; // Red channel is encoded with FFT band power (i.e. raw FFT data).
  float fftSpringPhysicsPosition = c.b; // Blue channel is encoded with a spring physics version of the FFT band power.
  float fftSpringPhysicsAcceleration = c.g; // Green channel is encoded with the acceleration of the FFT band (not very useful);
  bool trigger = c.a > 0.5; // Alpha channel is encoded with the whether or not the band is being "triggered" right now.
}
```


