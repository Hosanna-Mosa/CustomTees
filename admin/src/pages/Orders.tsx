import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Order = { _id: string; number?: string; total?: number; status?: string }

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getOrders()
      .then((res) => setOrders(res.data))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <section>
      <h2>Orders</h2>
      {error && <div className="error">{error}</div>}
      <ul className="list">
        {orders.map((o) => (
          <li key={o._id}>{o.number || o._id} - ${(o.total || 0) / 100} - {o.status || 'N/A'}</li>
        ))}
        {orders.length === 0 && !error && <li>No orders yet</li>}
      </ul>
    </section>
  )
}


