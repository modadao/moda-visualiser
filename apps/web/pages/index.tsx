import React, { FormEventHandler, useEffect, useRef, useState } from 'react'
import ModaVisualiser from 'moda-visualiser';
import TestFingerprint from '../data/test.json';

function App() {
  const container = useRef(null);
  console.log('app component')

  // Mount/dispose and remove visualiser on mount/unmount
  let visualiser: ModaVisualiser|undefined;
  useEffect(() => {
    if (container.current) {
      visualiser = new ModaVisualiser(container.current);
      // visualiser.updateFingerprint(TestFingerprint);
    }
    return () => {
      if (visualiser) {
        visualiser.dispose();
        visualiser = undefined;
      }
    }
  }, [])

  // Form state and submit to update visualiser
  const [address, setAddress] = useState('0x79c73e62a810cc47f83de3b43a7b09daa1731bab');
  const [id, setId] = useState('0xd7a297382315cb9e956ee85d078619899e6c72e87038a53715bf5d91319b279e');
  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    console.log('Handling form submit')
    if (visualiser) {
      visualiser.updateFingerprintFromApi(address, id);
    }
    if (e)
      e.preventDefault();
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
    </div>
  )
}

export default App

