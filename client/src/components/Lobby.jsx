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
        <div style={styles.brandIcon}>⌘</div>
        <h2 style={styles.title}>Sync Code</h2>
        <p style={styles.subtitle}>Join a collaborative room or start a fresh coding session.</p>

        <label style={styles.label} htmlFor="room-id">
          Room ID
        </label>
        <input
          id="room-id"
          style={styles.input}
          placeholder="Paste invitation room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <label style={styles.label} htmlFor="user-name">
          Username
        </label>
        <input
          id="user-name"
          style={styles.input}
          placeholder="Enter your display name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button type="submit" style={styles.joinButton}>
          Join Room <span style={styles.buttonIcon}>→</span>
        </button>

        <p style={styles.helperText}>
          Don't have an invite code?{" "}
          <button type="button" onClick={handleCreateRoom} style={styles.linkButton}>
            Create new room
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
    padding: "24px",
    boxSizing: "border-box",
    background: "radial-gradient(circle at top, #26364f 0%, #151922 42%, #0d1117 100%)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "min(100%, 420px)",
    padding: "34px",
    borderRadius: "22px",
    background: "linear-gradient(145deg, rgba(38, 47, 65, 0.96), rgba(25, 30, 42, 0.98))",
    color: "#f4f7fb",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
    boxSizing: "border-box",
  },
  brandIcon: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    marginBottom: "18px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #5cc8f5, #7c5cff)",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 800,
    boxShadow: "0 14px 30px rgba(92, 200, 245, 0.28)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "30px",
    lineHeight: 1.1,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    fontSize: "15px",
    lineHeight: 1.55,
    color: "#aeb8c8",
    margin: "0 0 28px",
  },
  label: {
    display: "block",
    margin: "0 0 8px",
    color: "#d9e2ef",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 15px",
    marginBottom: "18px",
    borderRadius: "12px",
    border: "1px solid rgba(174, 184, 200, 0.22)",
    background: "rgba(13, 17, 23, 0.52)",
    color: "#f4f7fb",
    fontSize: "15px",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  },
  joinButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "13px 16px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #5cc8f5, #63e6be)",
    color: "#08111d",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 34px rgba(92, 200, 245, 0.24)",
  },
  buttonIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  helperText: {
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "22px 0 0",
    textAlign: "center",
    color: "#aeb8c8",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#63e6be",
    cursor: "pointer",
    padding: 0,
    fontSize: "14px",
    fontWeight: 800,
    textDecoration: "none",
  },
};

export default Lobby;