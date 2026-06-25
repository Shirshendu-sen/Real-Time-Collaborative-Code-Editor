import { useState } from "react";
import "../styles/theme.css";

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
    padding: "var(--space-5)",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top, var(--accent-muted) 0%, transparent 36%), var(--bg-base)",
    fontFamily: "var(--font-ui)",
  },
  card: {
    width: "min(100%, 420px)",
    padding: "var(--space-6)",
    borderRadius: "var(--radius-lg)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-lg)",
    boxSizing: "border-box",
  },
  brandIcon: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    marginBottom: "var(--space-5)",
    borderRadius: "var(--radius-md)",
    background: "var(--accent)",
    color: "var(--text-primary)",
    fontSize: "24px",
    fontWeight: 800,
    boxShadow: "var(--shadow-md)",
  },
  title: {
    margin: "0 0 var(--space-2)",
    fontFamily: "var(--font-mono)",
    fontSize: "30px",
    lineHeight: 1.1,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    fontSize: "15px",
    lineHeight: 1.55,
    color: "var(--text-secondary)",
    margin: "0 0 var(--space-5)",
  },
  label: {
    display: "block",
    margin: "0 0 var(--space-2)",
    color: "var(--text-secondary)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 15px",
    marginBottom: "var(--space-5)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: "15px",
    outline: "none",
    boxShadow: "var(--shadow-sm)",
    transition: "border-color 150ms var(--ease), box-shadow 150ms var(--ease)",
  },
  joinButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-2)",
    padding: "13px 16px",
    border: "none",
    borderRadius: "var(--radius-md)",
    background: "var(--accent)",
    color: "var(--text-primary)",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "var(--shadow-md)",
    transition: "background 150ms var(--ease), box-shadow 150ms var(--ease)",
  },
  buttonIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  helperText: {
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "var(--space-5) 0 0",
    textAlign: "center",
    color: "var(--text-secondary)",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "var(--accent-hover)",
    cursor: "pointer",
    padding: 0,
    fontSize: "14px",
    fontWeight: 800,
    textDecoration: "none",
    transition: "color 150ms var(--ease)",
  },
};

export default Lobby;