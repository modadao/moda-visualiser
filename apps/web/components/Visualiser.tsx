import React, { useEffect, useRef, useState } from 'react'
import ModaVisualiser, { IFingerprint } from 'moda-visualiser';
import Song from '../data/roby.mp3';
import fingerprint from '../data/roby.json';

function Visualiser() {
  const container = useRef(null);
  console.log('app component')

  // Mount/dispose and remove visualiser on mount/unmount
  let visualiser: ModaVisualiser|undefined = undefined;
  useEffect(() => {
    if (container.current) {
      visualiser = new ModaVisualiser(container.current);
    }
    return () => {
      if (visualiser) {
        visualiser.dispose();
        visualiser = undefined;
      }
    }
  }, [])

  const handleExport = () => {
    if (visualiser) {
        (visualiser as ModaVisualiser).export(1024);
      }
  }

  // Form state and submit to update visualiser
  const [address, setAddress] = useState('0x79c73e62a810cc47f83de3b43a7b09daa1731bab');
  const [id, setId] = useState('0xd7a297382315cb9e956ee85d078619899e6c72e87038a53715bf5d91319b279e');
  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e)
      e.preventDefault();
    console.log('Handling form submit')
    if (visualiser) {
      // const response = await fetch(`http://206.189.47.33/?address=${address}&id=${id}`)
      // const response = await fetch(fingerprint);
      // const data = await response.json() as IFingerprint;
      visualiser.updateFingerprint(fingerprint, Song);
    }
  }
  return (
    <div className="App">
      <div ref={container}></div>
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
        <button onClick={handleExport}>Export</button>  
      </div>
      <div>
        <button onClick={() => visualiser && visualiser.play()}>Play</button>
        <button onClick={() => visualiser && visualiser.pause()}>Pause</button>
      </div>
    </div>
  )
}

export default Visualiser

