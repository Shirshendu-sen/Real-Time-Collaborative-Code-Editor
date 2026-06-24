import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

function Editor({ roomName = 'default-room', onCodeChange }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current) return

    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider('ws://localhost:4000', roomName, ydoc)
    const ytext = ydoc.getText('codemirror')
    onCodeChange?.(ytext.toString())

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
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomName, onCodeChange])

  return <div ref={editorRef} className="editor-container" />
}

export default Editor