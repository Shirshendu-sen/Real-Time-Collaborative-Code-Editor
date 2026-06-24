import { useState } from 'react'
import Editor from './components/Editor'
import './App.css'

function App() {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running...')

    try {
      const response = await fetch('http://localhost:4000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Code execution failed.')
      }

      const combinedOutput = `${result.stdout || ''}${result.stderr || ''}`
      setOutput(combinedOutput || `Process exited with code ${result.exitCode}`)
    } catch (error) {
      setOutput(error.message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <main className="app">
      <h1>Collaborative Code Editor</h1>
      <Editor onCodeChange={setCode} />
      <button className="run-button" onClick={runCode} disabled={isRunning || !code.trim()}>
        {isRunning ? 'Running...' : 'Run'}
      </button>
      <section className="output-panel" aria-live="polite">
        <h2>Output</h2>
        <pre>{output || 'Run code to see output here.'}</pre>
      </section>
    </main>
  )
}

export default App
