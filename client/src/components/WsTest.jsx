import { useEffect, useState } from 'react'

function WsTest() {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:4000')

    socket.onopen = () => socket.send('Hello from React!')
    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data])
    }

    return () => socket.close()
  }, [])

  return (
    <div>
      <h3>WebSocket Test</h3>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  )
}

export default WsTest