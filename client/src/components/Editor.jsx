import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import CodeContextMenu from './ai/CodeContextMenu'

const USER_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#009688', '#4caf50',
  '#ff9800', '#ff5722', '#795548', '#607d8b',
]

function hashUserName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getColorForUser(name) {
  return USER_COLORS[hashUserName(name) % USER_COLORS.length]
}

function Editor({ roomName = 'default-room', userName = 'Anonymous', onCodeChange, onAIAction, currentLanguage, aiEnabled = false }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const providerRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => {
    if (!editorRef.current) return

    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider('ws://localhost:4000', roomName, ydoc)
    providerRef.current = provider
    const ytext = ydoc.getText('codemirror')
    onCodeChange?.(ytext.toString())

    const handleStatus = (event) => {
      setConnectionStatus(event.status)
    }
    provider.on('status', handleStatus)

    const userColor = getColorForUser(userName)
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
    })

    const knownClientIds = new Set()

    const updateActiveUsers = (changes) => {
      const states = provider.awareness.getStates()
      const users = []
      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || 'var(--accent)',
          })
        }
      })
      setActiveUsers(users)

      if (changes) {
        const { added, removed } = changes
        if (added && added.length > 0) {
          added.forEach((clientId) => {
            const state = states.get(clientId)
            if (state && state.user && !knownClientIds.has(clientId)) {
              toast.info(`${state.user.name} joined the room`)
            }
          })
        }
        if (removed && removed.length > 0) {
          removed.forEach((clientId) => {
            const state = states.get(clientId)
            const name = state?.user?.name || 'A user'
            toast.warn(`${name} left the room`)
          })
        }
      }

      knownClientIds.clear()
      states.forEach((_state, clientId) => knownClientIds.add(clientId))
    }

    provider.awareness.on('change', updateActiveUsers)
    updateActiveUsers()

    const view = new EditorView({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        oneDark,
        javascript(),
        yCollab(ytext, provider.awareness),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onCodeChange?.(update.state.doc.toString())
          }
        }),
      ],
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      viewRef.current = null
      view.destroy()
      provider.off('status', handleStatus)
      provider.awareness.off('change', updateActiveUsers)
      provider.destroy()
      ydoc.destroy()
      providerRef.current = null
    }
  }, [roomName, userName, onCodeChange])

  const handleEditorMouseUp = useCallback((e) => {
    if (!aiEnabled) return
    const view = viewRef.current
    if (!view) return

    const { from, to } = view.state.selection.main
    if (from === to) {
      setContextMenu(null)
      return
    }

    const selectedText = view.state.doc.sliceString(from, to)
    if (!selectedText.trim()) {
      setContextMenu(null)
      return
    }

    setContextMenu({ x: e.clientX, y: e.clientY, code: selectedText })
  }, [aiEnabled])

  const handleContextMenuAction = useCallback((actionKey, extra = {}) => {
    if (!contextMenu) return

    const code = contextMenu.code
    setContextMenu(null)

    if (onAIAction) {
      onAIAction({
        action: actionKey,
        code,
        language: currentLanguage || 'JavaScript',
        ...extra,
      })
    }
  }, [contextMenu, onAIAction, currentLanguage])

  const statusLabel = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  }

  return (
    <div className="editor-layout">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar" aria-label="Workspace sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Status</h3>
          <div className="sidebar-status">
            <span className={`status-dot status-${connectionStatus}`} aria-hidden="true" />
            <span>{statusLabel[connectionStatus] || 'Unknown'}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Users <span className="sidebar-count">{activeUsers.length}</span>
          </h3>
          <ul className="sidebar-users">
            {activeUsers.map((user) => (
              <li key={user.clientId} className="sidebar-user">
                <span
                  className="sidebar-user-avatar"
                  style={{ backgroundColor: user.color }}
                  aria-hidden="true"
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="sidebar-user-name">{user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ─── Editor ─── */}
      <div className="editor-area">
        <div ref={editorRef} className="editor-container" onMouseUp={handleEditorMouseUp} />
      </div>

      {/* ─── Context Menu ─── */}
      {contextMenu && (
        <CodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          currentLanguage={currentLanguage || 'JavaScript'}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default Editor
