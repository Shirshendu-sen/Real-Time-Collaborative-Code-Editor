import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

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

function Editor({ roomName = 'default-room', userName = 'Anonymous', onCodeChange, onLeaveRoom }) {
  const editorRef = useRef(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const providerRef = useRef(null)

  useEffect(() => {
     if (!editorRef.current) return

    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider('ws://localhost:4000', roomName, ydoc)
    providerRef.current = provider
    const ytext = ydoc.getText('codemirror')
    onCodeChange?.(ytext.toString())

    // --- Connection status tracking ---
    const handleStatus = (event) => {
      setConnectionStatus(event.status)
    }
    provider.on('status', handleStatus)

    // --- Set local awareness (user info) ---
    const userColor = getColorForUser(userName)
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
    })

    // --- Track active users from awareness ---
    const knownClientIds = new Set()

    const updateActiveUsers = (changes) => {
      const states = provider.awareness.getStates()
      const users = []
      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId,
            name: state.user.name || 'Anonymous',
            // Use theme token for fallback user avatar background color
            color: state.user.color || 'var(--bg-card)',
          })
        }
      })
      setActiveUsers(users)

      // Detect joins and leaves from awareness changes
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

      // Track all current client IDs for next update
      knownClientIds.clear()
      states.forEach((_state, clientId) => knownClientIds.add(clientId))
    }

    provider.awareness.on('change', updateActiveUsers)
    // Initial population (no changes object, so pass undefined)
    updateActiveUsers()

    const view = new EditorView({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
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

    return () => {
      view.destroy()
      provider.off('status', handleStatus)
      provider.awareness.off('change', updateActiveUsers)
      provider.destroy()
      ydoc.destroy()
      providerRef.current = null
    }
  }, [roomName, userName, onCodeChange])

  const handleCopyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomName)
      .then(() => toast.success('Room ID copied to clipboard'))
      .catch(() => {})
  }, [roomName])

  const statusLabel = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  }

// Use theme tokens for status colors
const statusColor = {
  connected: 'var(--success)',
  connecting: 'var(--warning)',
  disconnected: 'var(--danger)',
}

  return (
    <div className="editor-layout">
      {/* ---- Sidebar ---- */}
      <aside className="editor-sidebar">
        {/* Connection Status */}
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Connection</h3>
          <div className="connection-status">
            <span
              className="status-dot"
              // Use theme token for fallback status dot color
              style={{ backgroundColor: statusColor[connectionStatus] || 'var(--text-secondary)' }}
            />
            <span>{statusLabel[connectionStatus] || 'Unknown'}</span>
          </div>
        </div>

        {/* Room Controls */}
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Room</h3>
          <div className="room-id-row">
            <span className="room-id-label">Room ID:</span>
            <button className="sidebar-btn copy-btn" onClick={handleCopyRoomId} title="Copy Room ID">
              📋 Copy
            </button>
          </div>
          <button className="sidebar-btn leave-btn" onClick={onLeaveRoom}>
            🚪 Leave Room
          </button>
        </div>

        {/* Active Users */}
        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Active Users
            <span className="user-count">({activeUsers.length})</span>
          </h3>
          <ul className="user-list">
            {activeUsers.map((user) => (
              <li key={user.clientId} className="user-item">
                <span
                  className="user-avatar"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ---- Editor area ---- */}
      <div className="editor-area">
        <div ref={editorRef} className="editor-container" />
      </div>
    </div>
  )
}

export default Editor