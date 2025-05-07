import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Header from './components/layout/Header'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-100">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Soleil Hostel</h1>
          <p className="mt-4">Click the button to count: {count}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
        </div>      
          </main>
    </div>
  )
}

export default App
