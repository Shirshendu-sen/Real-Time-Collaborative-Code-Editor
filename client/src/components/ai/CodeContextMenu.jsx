import { useEffect, useRef, useCallback } from 'react'

const ACTIONS = [
  { key: 'explain',  label: 'Explain',         icon: '💡' },
  { key: 'fix',      label: 'Improve Code',    icon: '✨' },
  { key: 'optimize', label: 'Optimize',        icon: '⚡' },
  { key: 'comment',  label: 'Add Comments',    icon: '💬' },
  { key: 'convert',  label: 'Convert Language', icon: '🔄' },
  { key: 'review',   label: 'Review Code',     icon: '📋' },
  { key: 'debug',    label: 'Debug Code',      icon: '🐛' },
]

const SUPPORTED_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust']

function CodeContextMenu({ x, y, currentLanguage, onAction, onClose }) {
  const menuRef = useRef(null)
  const targetLangRef = useRef(null)
  const focusedIndex = useRef(-1)

  useEffect(() => {
    if (!menuRef.current) return

    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let ax = x
    let ay = y
    if (x + rect.width > vw) ax = vw - rect.width - 8
    if (y + rect.height > vh) ay = vh - rect.height - 8
    if (ax < 0) ax = 8
    if (ay < 0) ay = 8

    menuRef.current.style.left = `${ax}px`
    menuRef.current.style.top = `${ay}px`
  }, [x, y])

  const getMenuItems = useCallback(() => {
    if (!menuRef.current) return []
    return Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
  }, [])

  const setFocus = useCallback((index) => {
    const items = getMenuItems()
    if (items.length === 0) return

    items.forEach((item) => item.setAttribute('data-focused', 'false'))

    if (index < 0) index = items.length - 1
    if (index >= items.length) index = 0

    focusedIndex.current = index
    items[index].setAttribute('data-focused', 'true')
    items[index].focus()
  }, [getMenuItems])

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocus(focusedIndex.current + 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocus(focusedIndex.current - 1)
          break
        case 'Home':
          e.preventDefault()
          setFocus(0)
          break
        case 'End':
          e.preventDefault()
          setFocus(getMenuItems().length - 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, setFocus, getMenuItems])

  useEffect(() => {
    const timer = requestAnimationFrame(() => setFocus(0))
    return () => cancelAnimationFrame(timer)
  }, [setFocus])

  const handleAction = (actionKey) => {
    if (actionKey === 'convert') {
      const toLanguage = targetLangRef.current?.value
      if (toLanguage) onAction(actionKey, { toLanguage })
      return
    }
    onAction(actionKey)
  }

  const convertTargets = SUPPORTED_LANGUAGES.filter(
    (lang) => lang.toLowerCase() !== (currentLanguage || '').toLowerCase()
  )

  return (
    <>
      <div className="ctx-overlay" onClick={onClose} />

      <div
        ref={menuRef}
        role="menu"
        aria-label="AI code actions"
        className="ctx-menu"
        style={{ left: x, top: y }}
      >
        <p className="ctx-heading">AI Actions</p>

        {ACTIONS.map((action) => {
          if (action.key === 'convert') {
            return (
              <div key={action.key} className="ctx-convert-row">
                <span className="ctx-convert-icon" aria-hidden="true">{action.icon}</span>
                <select
                  ref={targetLangRef}
                  aria-label="Target language"
                  className="ctx-convert-select"
                  defaultValue={convertTargets[0] || ''}
                >
                  {convertTargets.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <button
                  role="menuitem"
                  className="ctx-convert-btn"
                  onClick={() => handleAction('convert')}
                  type="button"
                >
                  Go
                </button>
              </div>
            )
          }

          return (
            <button
              key={action.key}
              role="menuitem"
              className="ctx-item"
              onClick={() => handleAction(action.key)}
              type="button"
              tabIndex={-1}
            >
              <span className="ctx-item-icon" aria-hidden="true">{action.icon}</span>
              {action.label}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default CodeContextMenu
