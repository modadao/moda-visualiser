import React, { useEffect, useRef, useState } from 'react'
import { Object3D, OrthographicCamera, WebGLRenderer, AxesHelper } from 'three';
import ModaVisualiser, { IFingerprint, IVisuals, DefaultVisuals, IAudioFrame, IDerivedFingerPrint  } from '@moda/moda-visualiser';
import Song from '../data/roby.mp3';
import fingerprint from '../data/roby.json';


class CustomVisuals extends Object3D implements IVisuals {
  axes: AxesHelper;
 constructor(
    _camera: OrthographicCamera,
    _renderer: WebGLRenderer,
    _fingerprint: IDerivedFingerPrint
  ) {
    super();
    this.axes = new AxesHelper(1);
    this.add(this.axes); // Scene elements should be added to self 
  }

  // Update function runs once per frame.
  update(elapsed: number, delta: number) {
    this.axes.rotateY(delta); // Rotate axes at a consistent speed
  }

  // Handle audio is run once every frame after update.  This is where you add the audio reactivity.
  handleAudio(frame: IAudioFrame) {
    this.axes.position.x = frame.power * 4; // Move axes up and down 
  }

  // Dispose function is run on unmount/when switching fingerprint or settings.
  // It is required to cleanup GPU resources, event listeners etc.
  dispose() {
    this.axes.dispose();
  }
}

function Visualiser() {
  console.log('app component')
  // Mount/dispose and remove visualiser on mount/unmount
  const container = useRef(null);
  const visualiser = useRef<ModaVisualiser>();
  const isLoading = useRef(false);
  useEffect(() => {
    if (container.current) {
      visualiser.current = new ModaVisualiser(container.current, DefaultVisuals);
      visualiser.current.addEventListener('loading', () => {
        console.log('loading')
        isLoading.current = true
      });
      visualiser.current.addEventListener('loaded', () => {
        console.log('loaded')
        isLoading.current = false
      });
      visualiser.current.addEventListener('play', () => {
        console.log('play')
      });
      visualiser.current.addEventListener('pause', () => {
        console.log('pause')
      });
    }
    return () => {
      if (visualiser.current) {
        visualiser.current.dispose();
        visualiser.current = null;
      }
    }
  }, [])

  const handleExport = () => {
    if (visualiser.current) {
        visualiser.current.export(1024);
      }
  }

  // Form state and submit to update visualiser
  const [address, setAddress] = useState('0x79c73e62a810cc47f83de3b43a7b09daa1731bab');
  const [id, setId] = useState('0xd7a297382315cb9e956ee85d078619899e6c72e87038a53715bf5d91319b279e');
  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e)
      e.preventDefault();
    if (visualiser.current) {
      const response = await fetch(`http://206.189.47.33/?address=${address}&id=${id}`)
      const data = await response.json() as IFingerprint;
      visualiser.current.updateFingerprint(data, Song);
    }
  }

  const submitRoby = () => {
    if (visualiser.current) {
      visualiser.current.updateFingerprint(fingerprint, Song);
    }
  }
  return (
    <div className="App">
      <div ref={container}></div>
      <h3>Options {isLoading.current ? "(Loading)" : ""}</h3>
      <form className="fetchform" onSubmit={handleSubmit}>
        <div>
          <span>Address</span>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address"></input>
        </div>
        <div>
          <span>Id</span>
          <input type="text" value={id} onChange={e => setId(e.target.value)} placeholder="ID"></input>
        </div>
        <div>
          <button type="submit">Fetch data</button>
        </div>
      </form>
      <div>
        <button onClick={submitRoby}> Play Roby Preset </button>
      </div>
      <div>
        <button onClick={handleExport}>Export</button>  
      </div>
      <div>
        <button onClick={() => visualiser.current && visualiser.current.play()}>Play</button>
        <button onClick={() => visualiser.current && visualiser.current.pause()}>Pause</button>
      </div>
    </div>
  )
}

export default Visualiser

