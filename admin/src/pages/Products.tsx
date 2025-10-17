import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Product = { _id: string; name: string; price: number; stock: number }

export function Products() {
  const [rows, setRows] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getProducts()
      .then((res) => setRows(res.data))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <section>
      <h2>Products</h2>
      {error && <div className="error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p._id}>
              <td>{p._id}</td>
              <td>{p.name}</td>
              <td>${(p.price / 100).toFixed(2)}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}


