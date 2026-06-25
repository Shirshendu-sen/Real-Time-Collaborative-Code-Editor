import { useState } from 'react'

const languages = ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust']

const styles = {
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: 700,
  },
  select: {
    minWidth: '150px',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(15, 23, 42, 0.92)',
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
  },
}

function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript')

  return (
    <label style={styles.label}>
      Language
      <select
        aria-label="Select programming language"
        value={selectedLanguage}
        onChange={(event) => setSelectedLanguage(event.target.value)}
        style={styles.select}
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LanguageSelector