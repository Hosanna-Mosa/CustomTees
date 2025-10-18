import { useEffect, useState } from 'react'
import api from '@/lib/api'

export function Dashboard() {
  const [stats, setStats] = useState<{ users: number; products: number; orders: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    api.getStats()
      .then((res) => {
        if (mounted) setStats(res.data)
      })
      .catch((e) => setError(e.message))
    return () => { mounted = false }
  }, [])

  return (
    <section>
      <h2>Dashboard</h2>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        <div className="stat">
          <div className="stat-value">{stats ? stats.orders : '—'}</div>
          <div className="stat-label">Orders</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats ? stats.products : '—'}</div>
          <div className="stat-label">Products</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats ? stats.users : '—'}</div>
          <div className="stat-label">Users</div>
        </div>
      </div>
    </section>
  )
}


