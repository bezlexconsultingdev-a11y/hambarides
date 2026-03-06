import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPendingApplications, approveApplication, declineApplication } from '../api/admin';
import type { DriverApplicationRow } from '../api/admin';
import styles from './TablePage.module.css';

function DocLink({ href, label }: { href: string; label: string }) {
  if (!href?.trim()) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
      {label}
    </a>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<DriverApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState<{ id: number; value: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadApplications = useCallback(() => {
    setLoading(true);
    getPendingApplications({ limit: 100 })
      .then((a) => setApplications(a.applications))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = (id: number) => {
    approveApplication(id)
      .then(loadApplications)
      .catch(console.error);
  };

  const handleDecline = (id: number, reason?: string) => {
    declineApplication(id, reason)
      .then(() => {
        setDeclineReason(null);
        loadApplications();
      })
      .catch(console.error);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Driver applications</h1>
      <p className={styles.muted}>
        Pending applications only. <Link to="/drivers">View all drivers</Link>.
      </p>
      {applications.length === 0 ? (
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
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        aria-label={expandedId === a.id ? 'Collapse' : 'View full details'}
                      >
                        {expandedId === a.id ? '▼' : '▶'}
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
                  {expandedId === a.id && (
                    <tr key={`${a.id}-details`}>
                      <td colSpan={9} className={styles.detailsCell}>
                        <div className={styles.detailsBox}>
                          <p><strong>Full address:</strong> {a.address}</p>
                          <p><strong>Documents (review all before approving):</strong></p>
                          {(a.license_expiry_date != null && a.license_expiry_date !== '') && (
                            <p><strong>License expiry:</strong> {a.license_expiry_date}</p>
                          )}
                          <p><strong>Documents (review all before approving):</strong></p>
                          <ul className={styles.docList}>
                            <li><DocLink href={a.id_document_url} label="ID document" /></li>
                            <li><DocLink href={a.selfie_url} label="Selfie / headshot" /></li>
                            <li><DocLink href={a.police_clearance_url} label="Police clearance" /></li>
                            <li><DocLink href={a.drivers_license_url} label="Driver's license" /></li>
                            {a.prdp_url?.trim() && <li><DocLink href={a.prdp_url} label="PrDP" /></li>}
                            {a.commercial_insurance_url?.trim() && <li><DocLink href={a.commercial_insurance_url} label="Commercial insurance" /></li>}
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
    </div>
  );
}
