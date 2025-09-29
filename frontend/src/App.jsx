
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  { /* useState returns an array where index 0 is the current state value and index 1 is a setter function to update it.
      So in this case useState will set userId to '' initially, then you can change it using setUserId().*/}
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSignIn = () => {
    // Validate login, call backend, etc.
    navigate('/dashboard') // This sends you to the dashboard page
  }

  const handleSignUp = () => {
    // Create account, call backend, etc.
    navigate('/dashboard') // This sends you to the dashboard page
  }

  return (
    <div className="app-container">
      <div className="login-box">
        <h2>Login</h2>
        
        <div className="field">
          { /* The htmlFor value should match the id it's corresponding input id */}
          <input
            id="userId"
            name="userId"                                        // used in form submission
            type="text"
            aria-label="UserID"                                  // used by screen readers
            placeholder="UserID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}  // Function that gets called when the input value changes
            autoComplete="username"
          />
        </div>

        <div className="field">
          <input
            id="password"
            name="password"
            type="text"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="password"
          />
        </div>

        <div className="actions">
          <button className="button button--secondary" onClick={handleSignUp}>
            Sign Up
          </button>

          <button className="button button--primary" onClick={handleSignIn}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
