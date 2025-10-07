import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'

function Login() {
  { /* useState returns an array where index 0 is the current state value and index 1 is a setter function to update it.
      So in this case useState will set userId to '' initially, then you can change it using setUserId().*/}
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  // Assigns an anonymous function [() => {...}] to the handleSignIn variable
  const handleSignIn = () => {
    // Validate login, call backend, etc.
    navigate('/dashboard') // This sends you to the dashboard page
  }

  const handleSignUp = () => {
    // Create account, call backend, etc.
    navigate('/dashboard')
  }

  return (
    <div className="app-container">
      <div className="login-box">
        <h2>Login</h2>

        <InputField
          id="userId"
          name="userId"                                        // used in form submission
          type="text"
          aria-label="UserID"                                  // used by screen readers
          placeholder="UserID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}  // Function that gets called when the input value changes
          autoComplete="username"
        />

        <InputField
          id="password"
          name="password"
          type="password"
          aria-label="Password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        <div className="actions">
          <Button variant="secondary" onClick={handleSignUp}>Sign Up</Button>
          <Button variant="primary" onClick={handleSignIn}>Sign In</Button>
        </div>
      </div>
    </div>
  )
}

export default Login
