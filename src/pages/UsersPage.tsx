import { useState, useEffect } from 'react';
import { getUsers } from '../api/admin';
import type { UserRow } from '../api/admin';
import styles from './TablePage.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    getUsers({ limit: 100, user_type: filter || undefined })
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Users</h1>
      <div className={styles.toolbar}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={styles.select}>
          <option value="">All</option>
          <option value="rider">Riders</option>
          <option value="driver">Drivers</option>
        </select>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Active</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.user_type}</td>
                <td>{u.is_active ? 'Yes' : 'No'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
