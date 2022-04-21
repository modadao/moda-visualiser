import dynamic from "next/dynamic"

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

export default App

