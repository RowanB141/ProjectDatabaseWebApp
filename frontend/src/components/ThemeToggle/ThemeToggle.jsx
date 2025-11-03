import React, { useEffect, useState } from 'react'
import './ThemeToggle.css'

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      const dark = saved === 'dark'
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    } else {
      // default to light mode when no saved preference
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const onChange = (e) => {
    const next = e.target.checked
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <div className="theme-toggle" title={isDark ? 'Dark mode' : 'Light mode'}>
      <label className="switch" aria-label="Toggle theme">
        <input type="checkbox" checked={isDark} onChange={onChange} />
        <span className="slider" />
      </label>
      <span className="mode-label">{isDark ? 'Dark' : 'Light'}</span>
    </div>
  )
}

export default ThemeToggle
