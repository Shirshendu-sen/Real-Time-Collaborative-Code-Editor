function ScoreBadge({ score }) {
  let level = 'good'
  if (score <= 4) level = 'bad'
  else if (score <= 6) level = 'warn'

  return (
    <span className={`review-score review-score-${level}`} aria-label={`Score: ${score} out of 10`}>
      {score}/10
    </span>
  )
}

function CategoryCard({ label, score, findings }) {
  return (
    <div className="review-card">
      <div className="review-card-header">
        <span className="review-card-label">{label}</span>
        <ScoreBadge score={score} />
      </div>
      {findings.length > 0 && (
        <ul className="review-findings">
          {findings.map((finding, i) => (
            <li key={i} className="review-finding">{finding}</li>
          ))}
        </ul>
      )}
      {findings.length === 0 && (
        <p className="review-no-issues">No issues found.</p>
      )}
    </div>
  )
}

function CodeReviewPanel({ review, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="review-panel">
        <div className="review-status" role="status">
          <span className="review-loading-dot" aria-hidden="true" />
          Analyzing code quality...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-panel">
        <div className="review-status review-status-error" role="alert">
          <p className="review-error-text">{error}</p>
          {onRetry && (
            <button className="btn btn-primary btn-xs" onClick={onRetry} type="button">
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!review) {
    return null
  }

  const categories = review.categories || {}

  return (
    <div className="review-panel">
      <div className="review-summary">
        <div className="review-summary-score">
          <ScoreBadge score={review.overallScore} />
        </div>
        <p className="review-summary-text">{review.summary}</p>
      </div>
      <div className="review-grid">
        {Object.entries(categories).map(([key, cat]) => (
          <CategoryCard
            key={key}
            label={cat.label}
            score={cat.score}
            findings={cat.findings}
          />
        ))}
      </div>
    </div>
  )
}

export default CodeReviewPanel
