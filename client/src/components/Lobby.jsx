import { useState } from 'react'

function generateRoomId() {
  return crypto.randomUUID()
}

function Lobby({ onJoinRoom }) {
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')

  function handleJoin(e) {
    e.preventDefault()
    const trimmedRoom = roomId.trim()
    const trimmedName = userName.trim()
    if (!trimmedRoom || !trimmedName) return
    onJoinRoom({ roomName: trimmedRoom, userName: trimmedName })
  }

  function handleCreateRoom() {
    setRoomId(generateRoomId())
  }

  return (
    <div className="lobby">
      <form className="lobby-card" onSubmit={handleJoin}>
        <div className="lobby-brand" aria-hidden="true">S</div>
        <h2 className="lobby-title">SyncCode</h2>
        <p className="lobby-subtitle">
          Join a collaborative room or start a fresh coding session.
        </p>

        <label className="lobby-label" htmlFor="room-id">Room ID</label>
        <input
          id="room-id"
          className="lobby-input"
          placeholder="Paste invitation room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          autoComplete="off"
        />

        <label className="lobby-label" htmlFor="user-name">Username</label>
        <input
          id="user-name"
          className="lobby-input"
          placeholder="Enter your display name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoComplete="off"
        />

        <button type="submit" className="lobby-submit">
          Join Room <span className="lobby-submit-arrow" aria-hidden="true">→</span>
        </button>

        <p className="lobby-footer">
          Don't have an invite code?{' '}
          <button type="button" onClick={handleCreateRoom} className="lobby-link">
            Create new room
          </button>
        </p>
      </form>
    </div>
  )
}

export default Lobby
