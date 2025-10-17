import { useEffect, useState } from 'react'
import api from '@/lib/api'

type User = { _id: string; name: string; email: string; role: string }

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <section>
      <h2>Users</h2>
      {error && <div className="error">{error}</div>}
      <div className="cards">
        {users.map((u) => (
          <div className="card" key={u._id}>
            <strong>{u.name}</strong>
            <span>{u.email}</span>
            <small>{u.role}</small>
          </div>
        ))}
      </div>
    </section>
  )
}


