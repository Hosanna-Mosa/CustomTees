import { FormEvent, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card" onSubmit={onSubmit}>
        <h1>Admin Login</h1>
        <label>
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}


