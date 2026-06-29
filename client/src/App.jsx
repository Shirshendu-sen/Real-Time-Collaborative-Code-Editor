import { useState, useCallback, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Editor from './components/Editor'
import LanguageSelector from './components/LanguageSelector'
import AIPanel from './components/ai/AIPanel'
import { callAIAction, extractResponseText, fetchAIStatus, fetchCodeReview } from './lib/aiClient'
import Lobby from './components/Lobby'
import CodeReviewPanel from './components/ai/CodeReviewPanel'
import './App.css'

const ACTION_LABELS = {
  explain: 'Explanation',
  fix: 'Improved Code',
  optimize: 'Optimization',
  comment: 'Commented Code',
  convert: 'Language Conversion',
  review: 'Code Review',
  debug: 'Debug Analysis',
  explainError: 'Error Explanation',
  generate: 'Generated Code',
}

function App() {
  const [session, setSession] = useState(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript')
  const [outputOpen, setOutputOpen] = useState(true)

  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiActionLabel, setAiActionLabel] = useState('')
  const [lastAIRequest, setLastAIRequest] = useState(null)

  const [reviewData, setReviewData] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    fetchAIStatus().then(setAiEnabled)
  }, [])

  const triggerCodeReview = useCallback(async (codeToReview, language, runOutput) => {
    if (!aiEnabled) return
    setReviewLoading(true)
    setReviewError('')
    setReviewData(null)

    try {
      const data = await fetchCodeReview({ code: codeToReview, language, output: runOutput })
      setReviewData(data)
    } catch (err) {
      setReviewError(err.message || 'Code review unavailable.')
    } finally {
      setReviewLoading(false)
    }
  }, [aiEnabled])

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    setOutputOpen(true)

    try {
      const response = await fetch('http://localhost:4000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: selectedLanguage }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Code execution failed.')
      }

      const combinedOutput = `${result.stdout || ''}${result.stderr || ''}`
      setOutput(combinedOutput || `Process exited with code ${result.exitCode}`)

      triggerCodeReview(code, selectedLanguage, combinedOutput)
    } catch (error) {
      setOutput(error.message)
    } finally {
      setIsRunning(false)
    }
  }

  const handleAIAction = useCallback(async ({ action, code: selectedCode, language, toLanguage }) => {
    if (!aiEnabled) return
    setAiPanelOpen(true)
    setAiLoading(true)
    setAiError('')
    setAiContent('')
    setAiActionLabel(ACTION_LABELS[action] || action)
    setLastAIRequest({ action, code: selectedCode, language, toLanguage })

    try {
      const data = await callAIAction(action, {
        code: selectedCode,
        language,
        fromLanguage: language,
        toLanguage,
      })
      setAiContent(extractResponseText(action, data))
    } catch (err) {
      setAiError(err.message || 'AI request failed.')
      toast.error('AI request failed.')
    } finally {
      setAiLoading(false)
    }
  }, [aiEnabled])

  const handleAIRetry = useCallback(() => {
    if (lastAIRequest) {
      handleAIAction(lastAIRequest)
    }
  }, [lastAIRequest, handleAIAction])

  const handleCopyRoomId = useCallback(() => {
    if (!session) return
    navigator.clipboard.writeText(session.roomName)
      .then(() => toast.success('Room ID copied'))
      .catch(() => {})
  }, [session])

  const handleReviewRetry = useCallback(() => {
    if (code.trim()) {
      triggerCodeReview(code, selectedLanguage, output)
    }
  }, [code, selectedLanguage, output, triggerCodeReview])

  if (!session) {
    return (
      <>
        <Lobby onJoinRoom={setSession} />
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop theme="dark" />
      </>
    )
  }

  const truncatedRoom = session.roomName.length > 24
    ? `${session.roomName.slice(0, 10)}...${session.roomName.slice(-4)}`
    : session.roomName

  return (
    <div className="workspace">
      {/* ─── Toolbar ─── */}
      <header className="toolbar" role="toolbar" aria-label="Workspace toolbar">
        <div className="toolbar-start">
          <div className="toolbar-brand">
            <span className="brand-icon" aria-hidden="true">S</span>
            <span className="brand-name">SyncCode</span>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-room">
            <span className="toolbar-room-name" title={session.roomName}>{truncatedRoom}</span>
            <button className="btn btn-ghost btn-xs" onClick={handleCopyRoomId} title="Copy Room ID">
              Copy ID
            </button>
          </div>
        </div>
        <div className="toolbar-end">
          <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
          <button
            className={`btn btn-primary btn-run${isRunning ? ' btn-running' : ''}`}
            onClick={runCode}
            disabled={isRunning || !code.trim()}
            aria-label={isRunning ? 'Code is running' : 'Run code'}
          >
            <span className="btn-run-icon" aria-hidden="true">{isRunning ? '◌' : '▶'}</span>
            {isRunning ? 'Running' : 'Run'}
          </button>
          {aiEnabled && (
            <button
              className={`btn btn-ghost${aiPanelOpen ? ' btn-active' : ''}`}
              onClick={() => setAiPanelOpen(v => !v)}
              aria-label="Toggle AI Assistant"
              aria-pressed={aiPanelOpen}
            >
              AI
            </button>
          )}
          <div className="toolbar-divider" />
          <div className="toolbar-user">
            <span className="toolbar-user-avatar" aria-hidden="true">
              {session.userName.charAt(0).toUpperCase()}
            </span>
            <span className="toolbar-user-name">{session.userName}</span>
          </div>
          <button className="btn btn-ghost btn-danger-text" onClick={() => setSession(null)}>
            Leave
          </button>
        </div>
      </header>

      {/* ─── Editor Body ─── */}
      <div className="workspace-body">
        <Editor
          roomName={session.roomName}
          userName={session.userName}
          onCodeChange={setCode}
          onAIAction={handleAIAction}
          currentLanguage={selectedLanguage}
          aiEnabled={aiEnabled}
        />
      </div>

      {/* ─── Output Pane ─── */}
      <section className="output-pane" aria-label="Code output">
        <header className="output-header">
          <div className="output-header-start">
            <span className="output-title">Output</span>
            {output && output !== 'Run code to see output here.' && (
              <span className={`output-badge${output === 'Running...' ? ' output-badge-running' : ''}`}>
                {output === 'Running...' ? 'Running' : 'Done'}
              </span>
            )}
          </div>
          <div className="output-header-end">
            {output && output !== 'Run code to see output here.' && (
              <button className="btn btn-ghost btn-xs" onClick={() => setOutput('')}>Clear</button>
            )}
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setOutputOpen(v => !v)}
              aria-label={outputOpen ? 'Collapse output' : 'Expand output'}
              aria-expanded={outputOpen}
            >
              {outputOpen ? '▾' : '▴'}
            </button>
          </div>
        </header>
        {outputOpen && (
          <pre className="output-content" aria-live="polite">
            {output || 'Run code to see output here.'}
          </pre>
        )}
      </section>

      {/* ─── Code Review Panel (auto-triggered after Run) ─── */}
      {aiEnabled && (reviewLoading || reviewError || reviewData) && (
        <section className="code-review-pane" aria-label="Code review">
          <header className="code-review-header">
            <span className="code-review-title">Code Review</span>
            {reviewData && !reviewLoading && (
              <button className="btn btn-ghost btn-xs" onClick={() => setReviewData(null)}>
                Dismiss
              </button>
            )}
          </header>
          <CodeReviewPanel
            review={reviewData}
            isLoading={reviewLoading}
            error={reviewError}
            onRetry={handleReviewRetry}
          />
        </section>
      )}

      {/* ─── AI Panel ─── */}
      {aiEnabled && (
        <aside
          className={`ai-panel-wrapper${aiPanelOpen ? ' ai-panel-wrapper-open' : ''}`}
          aria-label="AI Assistant"
          aria-hidden={!aiPanelOpen}
        >
          <AIPanel
            title="AI Assistant"
            actionLabel={aiActionLabel}
            content={aiContent}
            isLoading={aiLoading}
            error={aiError}
            onClose={() => setAiPanelOpen(false)}
            onRetry={handleAIRetry}
          />
        </aside>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop theme="dark" />
    </div>
  )
}

export default App
