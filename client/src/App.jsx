import { useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Editor from './components/Editor'
import Lobby from './components/Lobby'
import './App.css'

const styles = {
  app: {
    minHeight: '100vh',
    padding: '24px',
    boxSizing: 'border-box',
    background:
      'radial-gradient(circle at top, rgba(88, 101, 242, 0.18) 0%, rgba(15, 23, 42, 0.96) 38%, #020617 100%)',
    color: '#e2e8f0',
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shell: {
    width: 'min(100%, 1280px)',
    margin: '0 auto',
  },
  introSection: {
    display: 'grid',
    gap: '18px',
    justifyItems: 'center',
    padding: '24px 0',
  },
  introBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(15, 23, 42, 0.58)',
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    boxShadow: '0 10px 30px rgba(2, 6, 23, 0.24)',
  },
  introTitle: {
    margin: 0,
    maxWidth: '760px',
    color: '#f8fafc',
    fontSize: 'clamp(2.1rem, 5vw, 4rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.05em',
    textAlign: 'center',
  },
  introText: {
    margin: 0,
    maxWidth: '680px',
    color: '#94a3b8',
    fontSize: '16px',
    lineHeight: 1.65,
    textAlign: 'center',
  },
  workspace: {
    display: 'grid',
    gap: '18px',
  },
  workspaceHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '18px',
    padding: '22px 24px',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '22px',
    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.68))',
    boxShadow: '0 18px 50px rgba(2, 6, 23, 0.28)',
    backdropFilter: 'blur(14px)',
  },
  workspaceHeadingGroup: {
    display: 'grid',
    gap: '8px',
  },
  workspaceLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#7dd3fc',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  workspaceTitle: {
    margin: 0,
    color: '#f8fafc',
    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
    lineHeight: 1.1,
    letterSpacing: '-0.04em',
  },
  workspaceText: {
    margin: 0,
    maxWidth: '720px',
    color: '#94a3b8',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  workspaceMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  metaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '14px',
    background: 'rgba(30, 41, 59, 0.76)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '18px',
  },
  editorCard: {
    padding: '16px',
    borderRadius: '24px',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(15, 23, 42, 0.74)',
    boxShadow: '0 18px 60px rgba(2, 6, 23, 0.32)',
    overflow: 'hidden',
  },
  utilityPanel: {
    padding: '20px',
    borderRadius: '24px',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.72))',
    boxShadow: '0 18px 50px rgba(2, 6, 23, 0.28)',
    display: 'grid',
    gap: '16px',
  },
  panelHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  panelTitleGroup: {
    display: 'grid',
    gap: '6px',
  },
  panelEyebrow: {
    color: '#7dd3fc',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  panelTitle: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '20px',
    letterSpacing: '-0.03em',
  },
  panelText: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  runButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #38bdf8, #22c55e)',
    color: '#020617',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 16px 32px rgba(34, 197, 94, 0.18)',
  },
  outputPanel: {
    margin: 0,
  },
  outputWindow: {
    minHeight: '180px',
    margin: 0,
    padding: '18px',
    overflow: 'auto',
    color: '#e2e8f0',
    background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.96), rgba(15, 23, 42, 0.98))',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '18px',
    whiteSpace: 'pre-wrap',
    fontSize: '14px',
    lineHeight: 1.65,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  },
}

function App() {
  const [session, setSession] = useState(null)
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
    <main className="app" style={styles.app}>
      <div style={styles.shell}>
      {session === null ? (
        <section style={styles.introSection}>
          <span style={styles.introBadge}>⚡ Realtime Pair Programming</span>
          <h1 style={styles.introTitle}>Collaborative Code Editor</h1>
          <p style={styles.introText}>
            Create a room, invite teammates, and jump into a focused coding workspace with
            instant sharing and quick feedback.
          </p>
          <Lobby onJoinRoom={setSession} />
        </section>
      ) : (
        <section style={styles.workspace}>
          <header style={styles.workspaceHeader}>
            <div style={styles.workspaceHeadingGroup}>
              <span style={styles.workspaceLabel}>🧠 Live Coding Session</span>
              <h1 style={styles.workspaceTitle}>Collaborative Code Editor</h1>
              <p style={styles.workspaceText}>
                Write together in real time, run code when you are ready, and keep the
                latest output visible in a dedicated console panel.
              </p>
            </div>

            <div style={styles.workspaceMeta}>
              <span style={styles.metaPill}>👤 {session.userName}</span>
              <span style={styles.metaPill}>🏷️ {session.roomName}</span>
            </div>
          </header>

          <div style={styles.contentGrid}>
            <div style={styles.editorCard}>
              <Editor
                roomName={session.roomName}
                userName={session.userName}
                onLeaveRoom={() => setSession(null)}
                onCodeChange={setCode}
              />
            </div>

            <section style={styles.utilityPanel} aria-live="polite">
              <div style={styles.panelHeader}>
                <div style={styles.panelTitleGroup}>
                  <span style={styles.panelEyebrow}>▶ Execution</span>
                  <h2 style={styles.panelTitle}>Output Console</h2>
                  <p style={styles.panelText}>
                    Run the current code and inspect the latest output stream here.
                  </p>
                </div>

                <button
                  className="run-button"
                  style={styles.runButton}
                  onClick={runCode}
                  disabled={isRunning || !code.trim()}
                >
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>

              <section className="output-panel" style={styles.outputPanel}>
                <pre style={styles.outputWindow}>{output || 'Run code to see output here.'}</pre>
              </section>
            </section>
          </div>
        </section>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        theme="dark"
      />
      </div>
    </main>
  )
}

export default App
