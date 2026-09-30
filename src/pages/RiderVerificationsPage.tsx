import React, { useState, useEffect, useCallback } from 'react';
import {
  getPendingRiderVerifications,
  approveRiderVerification,
  rejectRiderVerification,
} from '../api/admin';
import type { RiderVerificationRow } from '../api/admin';
import styles from './TablePage.module.css';

function DocLink({ href, label }: { href?: string | null; label: string }) {
  const cleanHref = href?.trim();
  if (!cleanHref) return null;
  return (
    <a href={cleanHref} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
      {label}
    </a>
  );
}

function docTypeLabel(type: string) {
  const t = String(type || '').toLowerCase();
  if (t === 'id_card') return 'SA ID';
  if (t === 'passport') return 'Passport';
  if (t === 'drivers_license') return "Driver's licence";
  return type || '—';
}

export default function RiderVerificationsPage() {
  const [rows, setRows] = useState<RiderVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState<{ id: string; value: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getPendingRiderVerifications({ limit: 100 })
      .then((r) => setRows(r.verifications || []))
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load verifications';
        setError(String(msg));
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const handleApprove = (id: string) => {
    approveRiderVerification(id)
      .then(() => load())
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Approve failed';
        window.alert(String(msg));
      });
  };

  const handleReject = (id: string, reason?: string) => {
    rejectRiderVerification(id, reason)
      .then(() => {
        setRejectReason(null);
        load();
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Reject failed';
        window.alert(String(msg));
      });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Rider verifications</h1>
      <p className={styles.muted}>
        Pending identity checks from the rider app. Compare the ID photo with the selfie before approving.
      </p>
      {error ? (
        <p className={styles.muted} style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className={styles.muted}>No pending rider verifications.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Document</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <React.Fragment key={v.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                        aria-label={expandedId === v.id ? 'Collapse' : 'View documents'}
                      >
                        {expandedId === v.id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>{v.full_name}</td>
                    <td>{v.email || '—'}</td>
                    <td>{v.gender || '—'}</td>
                    <td>{docTypeLabel(v.document_type)}</td>
                    <td>{v.created_at ? new Date(v.created_at).toLocaleString() : '—'}</td>
                    <td>
                      {rejectReason?.id === v.id ? (
                        <span>
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={rejectReason.value}
                            onChange={(e) => setRejectReason({ id: v.id, value: e.target.value })}
                            className={styles.input}
                          />
                          <button
                            type="button"
                            onClick={() => handleReject(v.id, rejectReason.value)}
                            className={styles.btnDanger}
                          >
                            Confirm reject
                          </button>
                          <button type="button" onClick={() => setRejectReason(null)}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span>
                          <button
                            type="button"
                            onClick={() => handleApprove(v.id)}
                            className={styles.btnPrimary}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectReason({ id: v.id, value: '' })}
                            className={styles.btnDanger}
                          >
                            Reject
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr key={`${v.id}-details`}>
                      <td colSpan={7} className={styles.detailsCell}>
                        <div className={styles.detailsBox}>
                          <p>
                            <strong>Phone:</strong> {v.phone || '—'}
                          </p>
                          <p>
                            <strong>Documents (open and compare before approving):</strong>
                          </p>
                          <ul className={styles.docList}>
                            <li>
                              <DocLink href={v.front_image_url || v.document_url} label="ID / document front" />
                            </li>
                            {v.back_image_url?.trim() ? (
                              <li>
                                <DocLink href={v.back_image_url} label="Document back" />
                              </li>
                            ) : null}
                            <li>
                              <DocLink href={v.selfie_url} label="Selfie" />
                            </li>
                          </ul>
                          {(v.front_image_url || v.document_url || v.selfie_url) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                              {(v.front_image_url || v.document_url) && (
                                <a
                                  href={(v.front_image_url || v.document_url)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={(v.front_image_url || v.document_url)!}
                                    alt="ID document"
                                    style={{
                                      maxWidth: 220,
                                      maxHeight: 160,
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      border: '1px solid #e0e0e0',
                                    }}
                                  />
                                </a>
                              )}
                              {v.selfie_url && (
                                <a href={v.selfie_url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={v.selfie_url}
                                    alt="Selfie"
                                    style={{
                                      maxWidth: 160,
                                      maxHeight: 160,
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      border: '1px solid #e0e0e0',
                                    }}
                                  />
                                </a>
                              )}
                            </div>
                          )}
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
