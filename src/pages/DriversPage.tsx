import React, { useState, useEffect, useCallback } from 'react';
import { getDrivers, getPendingApplications, approveApplication, declineApplication } from '../api/admin';
import type { DriverRow, DriverApplicationRow } from '../api/admin';
import styles from './TablePage.module.css';

function DocLink({ href, label }: { href: string; label: string }) {
  if (!href?.trim()) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
      {label}
    </a>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [applications, setApplications] = useState<DriverApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState<{ id: number; value: string } | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

  const loadDrivers = useCallback(() => {
    getDrivers({ limit: 100 })
      .then((d) => setDrivers(d.drivers))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  const loadApplications = useCallback(() => {
    setAppLoading(true);
    getPendingApplications({ limit: 100 })
      .then((a) => setApplications(a.applications))
      .catch(() => setApplications([]))
      .finally(() => setAppLoading(false));
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = (id: number) => {
    approveApplication(id)
      .then(() => {
        loadApplications();
        loadDrivers();
      })
      .catch(console.error);
  };

  const handleDecline = (id: number, reason?: string) => {
    declineApplication(id, reason)
      .then(() => {
        setDeclineReason(null);
        loadApplications();
        loadDrivers();
      })
      .catch(console.error);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Drivers</h1>

      <h2 className={styles.subtitle}>Pending driver applications</h2>
      {appLoading ? (
        <div className={styles.loading}>Loading applications...</div>
      ) : applications.length === 0 ? (
        <p className={styles.muted}>No pending applications.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>App ID</th>
                <th>Full name</th>
                <th>Email</th>
                <th>Country of birth</th>
                <th>Address</th>
                <th>Police clearance date</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <React.Fragment key={a.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() => setExpandedAppId(expandedAppId === a.id ? null : a.id)}
                        aria-label={expandedAppId === a.id ? 'Collapse' : 'View full details'}
                      >
                        {expandedAppId === a.id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>{a.id}</td>
                    <td>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td>{a.country_of_birth}</td>
                    <td className={styles.cellClip}>{a.address}</td>
                    <td>{a.police_clearance_issue_date}</td>
                    <td>{new Date(a.submitted_at).toLocaleString()}</td>
                    <td>
                      {declineReason?.id === a.id ? (
                        <span>
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={declineReason.value}
                            onChange={(e) => setDeclineReason({ id: a.id, value: e.target.value })}
                            className={styles.input}
                          />
                          <button type="button" onClick={() => handleDecline(a.id, declineReason.value)} className={styles.btnDanger}>
                            Confirm decline
                          </button>
                          <button type="button" onClick={() => setDeclineReason(null)}>Cancel</button>
                        </span>
                      ) : (
                        <span>
                          <button type="button" onClick={() => handleApprove(a.id)} className={styles.btnPrimary}>Approve</button>
                          <button type="button" onClick={() => setDeclineReason({ id: a.id, value: '' })} className={styles.btnDanger}>Decline</button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedAppId === a.id && (
                    <tr>
                      <td colSpan={9} className={styles.detailsCell}>
                        <div className={styles.detailsBox}>
                          <p><strong>Full address:</strong> {a.address}</p>
                          <p><strong>Documents (review all before approving):</strong></p>
                          <ul className={styles.docList}>
                            <li><DocLink href={a.id_document_url} label="ID document" /></li>
                            <li><DocLink href={a.selfie_url} label="Selfie / headshot" /></li>
                            <li><DocLink href={a.police_clearance_url} label="Police clearance" /></li>
                            <li><DocLink href={a.drivers_license_url} label="Driver's license" /></li>
                            <li>
                              Vehicle photos: {a.vehicle_photos_urls?.split(',').map((url, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && ', '}
                                  <DocLink href={url.trim()} label={`Photo ${i + 1}`} />
                                </React.Fragment>
                              ))}
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className={styles.subtitle}>All drivers</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Plate</th>
              <th>Available</th>
              <th>Rating</th>
              <th>Rides</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.first_name} {d.last_name}</td>
                <td>{d.email}</td>
                <td>{d.phone}</td>
                <td>{d.vehicle_make} {d.vehicle_model} ({d.vehicle_year})</td>
                <td>{d.vehicle_plate_number}</td>
                <td>{d.is_available ? 'Yes' : 'No'}</td>
                <td>{Number(d.rating).toFixed(1)}</td>
                <td>{d.total_rides}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
