import { FormEvent, useState } from 'react'
import { PasswordInput } from '../components/PasswordInput'
import { api } from '../lib/api'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setShowCodeDialog(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    // Just verify the code format and move to password dialog
    setShowCodeDialog(false)
    setShowPasswordDialog(true)
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setResetLoading(true)
    setError(null)
    try {
      await api.resetPassword(email, verificationCode, newPassword)
      // Redirect to login page
      window.location.href = '/login'
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      {!showCodeDialog && !showPasswordDialog && (
        <form className="card" onSubmit={handleSendCode}>
          <h1>Forgot Password</h1>
          <label>
            <span>Email</span>
            <input 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@example.com" 
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={loading} type="submit">
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
              Back to Login
            </a>
          </div>
        </form>
      )}

      {showCodeDialog && (
        <div className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <h2>Enter Verification Code</h2>
          <form onSubmit={handleVerifyCode}>
            <label>
              <span>Verification Code</span>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary" disabled={resetLoading} type="submit">
              {resetLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        </div>
      )}

      {showPasswordDialog && (
        <div className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <h2>Set New Password</h2>
          <form onSubmit={handleResetPassword}>
            <label>
              <span>New Password</span>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
              />
            </label>
            <label>
              <span>Confirm New Password</span>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary" disabled={resetLoading} type="submit">
              {resetLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
