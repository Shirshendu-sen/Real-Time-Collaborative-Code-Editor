function AIPanel({
  title = 'AI Assistant',
  actionLabel = 'Response',
  content = '',
  isLoading = false,
  error = '',
  onClose,
  onRetry,
  children,
}) {
  const hasContent = Boolean(content || children)

  return (
    <div className="ai-panel">
      <header className="ai-panel-header">
        <div className="ai-panel-title-group">
          <span className="ai-panel-eyebrow">{actionLabel}</span>
          <h2 className="ai-panel-title">{title}</h2>
        </div>
        {onClose && (
          <button className="btn btn-ghost btn-xs" onClick={onClose} aria-label="Close AI panel" type="button">
            Close
          </button>
        )}
      </header>

      <div className="ai-panel-body" aria-busy={isLoading} aria-live="polite">
        {isLoading && (
          <div className="ai-panel-status" role="status">
            <span className="ai-panel-loading-dot" aria-hidden="true" />
            Analyzing code...
          </div>
        )}

        {error && (
          <div className="ai-panel-status" role="alert">
            <p className="ai-panel-error">{error}</p>
          </div>
        )}

        {!isLoading && !error && hasContent && (
          children || <pre className="ai-panel-content">{content}</pre>
        )}

        {!isLoading && !error && !hasContent && (
          <div className="ai-panel-empty">
            Select code and choose an AI action to see results here.
          </div>
        )}
      </div>

      {error && onRetry && (
        <footer className="ai-panel-footer">
          <button className="btn btn-primary btn-xs" onClick={onRetry} type="button">
            Try again
          </button>
        </footer>
      )}
    </div>
  )
}

export default AIPanel
