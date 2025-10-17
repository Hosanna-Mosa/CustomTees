import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Order = { _id: string; total?: number; status?: string; user?: any; items?: any[] }

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    api.getOrders()
      .then((res) => setOrders(res.data))
      .catch((e) => setError(e.message))
  }, [])

  async function updateStatus(id: string, status: string) {
    try {
      setSaving(id)
      await api.updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)))
    } catch (e) {
      setError('Failed to update status')
    } finally {
      setSaving(null)
    }
  }

  return (
    <section>
      <h2>Orders</h2>
      {error && <div className="error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o._id.slice(-6)}</td>
              <td>{o.user?.name || '—'}</td>
              <td>₹{((o.total || 0) / 100).toFixed(2)}</td>
              <td>{o.status}</td>
              <td>
                <select disabled={saving === o._id} value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                  <option value="placed">placed</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && !error && <div>No orders yet</div>}
    </section>
  )
}


