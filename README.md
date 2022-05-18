# Moda NFT Visualiser

## Overview

This is a turborepo project containing both the visualiser library and an example integration with a next app.

- `./apps/web/` Next.js project showing how the component might be used
- `./packages/moda-visualiser/` Moda visualiser as a typescript library. 

## Getting started

- Run `yarn` inside of the monorepo root (same folder as this README.md) to install the dependencies
- Run `yarn build` inside of the monorepo root to build the moda-visualiser library.
- Run `yarn dev` to run a dev server and view the visualiser in the next app.

## How to use

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

### Initialising the visualiser

The visualiser needs to be constructed on mount (here via a `useEffect` hook) and disposed on unmount.
This is because the visualiser will create a lot of GPU resources + add event
listeners that will need to be disposed at the end of the lifecycle.

```javascript
import ModaVisualiser, { DefaultVisuals } from '@moda/moda-visualiser';

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

### Implementing custom visuals

Implement custom visuals by passing the implementation of the visuals to the ModaVisualiser.  You can create custom visuals using the following code block.

```typescript
import { Object3D, OrthographicCamera, WebGLRenderer } from 'three';
import { IVisuals, IDerivedFingerPrint, IAudioFrame } from '@moda/moda-visualiser';

export default class CustomVisuals extends Object3D implements IVisuals {
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
    this.axes.rotateY(delta * 5); // Rotate axes at a consistent speed
  }

  // Handle audio is run once every frame after update.  This is where you add the audio reactivity.
  handleAudio(frame: IAudioFrame) {
    this.axes.position.y = frame.power; // Move axes up and down 
  }

  // Dispose function is run on unmount/when switching fingerprint or settings.
  // It is required to cleanup GPU resources, event listeners etc.
  dispose() {
    this.axes.dispose();
  }
}
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



## Integration

- If you don't want/need the Next.js app or monorepo you should just be able to pull `packages/moda-visualiser` out into it's own folder and run `yarn && yarn build`.  There are no cross-dependencies.
- Alternatively you can run `yarn build` and use the output bundle `./packages/moda-visualiser/dist/moda-visualiser.es.js`.
