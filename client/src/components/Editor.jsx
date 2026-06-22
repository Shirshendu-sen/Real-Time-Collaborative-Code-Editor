import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'

function Editor() {
  const editorRef = useRef(null)
  const viewRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const view = new EditorView({
      doc: '// Start typing your code here\n',
      extensions: [basicSetup, javascript()],
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  return <div ref={editorRef} className="editor-container" />
}

export default Editor