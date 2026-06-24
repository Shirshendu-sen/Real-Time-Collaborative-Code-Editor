import { useState } from "react";

// crypto.randomUUID() ships with every modern browser - no package needed.
// It only works in a "secure context" (https:// or http://localhost), which
// covers local dev and any real deployment, since those should be on https anyway.
// We use the full UUID (not a shortened slice) - Sync Code's own room IDs are
// full-length UUIDs too, as you can see in the lobby screenshot.
function generateRoomId() {
  return crypto.randomUUID();
}

function Lobby({ onJoinRoom }) {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  function handleJoin(e) {
    e.preventDefault();
    const trimmedRoom = roomId.trim();
    const trimmedName = userName.trim();
    if (!trimmedRoom || !trimmedName) return; // both fields are required
    onJoinRoom({ roomName: trimmedRoom, userName: trimmedName });
  }

  function handleCreateRoom() {
    setRoomId(generateRoomId());
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleJoin}>
        <h2 style={styles.title}>Sync Code</h2>
        <p style={styles.subtitle}>Paste an invitation Room ID, or create a new one</p>

        <input
          style={styles.input}
          placeholder="ROOM ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="USERNAME"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button type="submit" style={styles.joinButton}>
          Join
        </button>

        <p style={styles.helperText}>
          Don't have an invite code?{" "}
          <button type="button" onClick={handleCreateRoom} style={styles.linkButton}>
            create new room
          </button>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1c1f26",
  },
  card: {
    width: "320px",
    padding: "28px",
    borderRadius: "8px",
    background: "#262b35",
    color: "#e6e6e6",
  },
  title: { margin: "0 0 4px" },
  subtitle: { fontSize: "13px", color: "#9aa0ac", marginBottom: "20px" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: "4px",
    border: "none",
    background: "#e9e9ec",
  },
  joinButton: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "4px",
    background: "#5cc8f5",
    fontWeight: "bold",
    cursor: "pointer",
  },
  helperText: { fontSize: "13px", marginTop: "16px", textAlign: "center" },
  linkButton: {
    background: "none",
    border: "none",
    color: "#4ecdc4",
    cursor: "pointer",
    padding: 0,
    fontSize: "13px",
    textDecoration: "underline",
  },
};

export default Lobby;