import { useState } from 'react'

const languages = ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust']

function LanguageSelector({ value, onChange }) {
  const [internalValue, setInternalValue] = useState('JavaScript')

  const selected = value !== undefined ? value : internalValue

  const handleChange = (event) => {
    const lang = event.target.value
    setInternalValue(lang)
    if (onChange) onChange(lang)
  }

  return (
    <select
      aria-label="Select programming language"
      className="lang-select"
      value={selected}
      onChange={handleChange}
    >
      {languages.map((language) => (
        <option key={language} value={language}>{language}</option>
      ))}
    </select>
  )
}

export default LanguageSelector
