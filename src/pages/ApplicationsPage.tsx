import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPendingApplications, approveApplication, declineApplication } from '../api/admin';
import type { DriverApplicationRow } from '../api/admin';
import styles from './TablePage.module.css';

function splitDocumentUrls(value?: string | null): string[] {
  return String(value || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

function DocLink({ href, label }: { href: string; label: string }) {
  const cleanHref = href?.trim();
  if (!cleanHref) return null;
  return (
    <a href={cleanHref} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
      {label}
    </a>
  );
}

function DocLinks({ value, label, labels }: { value?: string | null; label: string; labels?: string[] }) {
  const urls = splitDocumentUrls(value);
  if (!urls.length) return null;
  return (
    <>
      {urls.map((url, index) => (
        <React.Fragment key={`${label}-${url}-${index}`}>
          {index > 0 && ', '}
          <DocLink href={url} label={labels?.[index] || (urls.length > 1 ? `${label} ${index + 1}` : label)} />
        </React.Fragment>
      ))}
    </>
  );
}

function hasBankingDetails(application: DriverApplicationRow) {
  return Boolean(
    application.bank_name?.trim() ||
    application.account_holder_name?.trim() ||
    application.account_number?.trim() ||
    application.account_type?.trim() ||
    application.branch_code?.trim()
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<DriverApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [declineReason, setDeclineReason] = useState<{ id: number; value: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadApplications = useCallback(() => {
    setLoading(true);
    setError('');
    getPendingApplications({ limit: 100 })
      .then((a) => setApplications(a.applications))
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load applications';
        setError(String(msg));
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadApplications();
    const id = setInterval(() => {
      loadApplications();
    }, 15000);
    return () => clearInterval(id);
  }, [loadApplications]);

  const handleApprove = (id: number) => {
    approveApplication(id)
      .then((res) => {
        if (res.emailSent === false) {
          window.alert(
            `Application approved, but the email was not sent (${res.emailError || 'check RESEND_API_KEY and FROM_EMAIL on the server'}). Tell the driver they can log in to the driver app.`
          );
        }
        loadApplications();
      })
      .catch((err) => {
        console.error(err);
        const msg = err?.response?.data?.error || err?.message || 'Approve failed';
        window.alert(String(msg));
      });
  };

  const handleDecline = (id: number, reason?: string) => {
    declineApplication(id, reason)
      .then((res) => {
        if (res.emailSent === false && res.emailError) {
          window.alert(`Declined, but email was not sent (${res.emailError}).`);
        }
        setDeclineReason(null);
        loadApplications();
      })
      .catch((err) => {
        console.error(err);
        const msg = err?.response?.data?.error || err?.message || 'Decline failed';
        window.alert(String(msg));
      });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Driver applications</h1>
      <p className={styles.muted}>
        Pending applications only. <Link to="/drivers">View all drivers</Link>.
      </p>
      {error ? <p className={styles.muted} style={{ color: '#b91c1c' }}>{error}</p> : null}
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
                          {(a.license_expiry_date != null && a.license_expiry_date !== '') && (
                            <p><strong>License expiry:</strong> {a.license_expiry_date}</p>
                          )}
                          {hasBankingDetails(a) && (
                            <>
                              <p><strong>Banking details:</strong></p>
                              <ul className={styles.docList}>
                                <li><strong>Bank:</strong> {a.bank_name || '-'}</li>
                                <li><strong>Account holder:</strong> {a.account_holder_name || '-'}</li>
                                <li><strong>Account number:</strong> {a.account_number || '-'}</li>
                                <li><strong>Account type:</strong> {a.account_type || '-'}</li>
                                <li><strong>Branch code:</strong> {a.branch_code || '-'}</li>
                              </ul>
                            </>
                          )}
                          <p><strong>Documents (review all before approving):</strong></p>
                          <ul className={styles.docList}>
                            <li><DocLinks value={a.id_document_url} label="ID document" /></li>
                            <li><DocLinks value={a.selfie_url} label="Selfie / headshot" /></li>
                            <li><DocLinks value={a.police_clearance_url} label="Police clearance" /></li>
                            <li><DocLinks value={a.drivers_license_url} label="Driver's license" labels={["Driver's license front", "Driver's license back"]} /></li>
                            {a.prdp_url?.trim() && <li><DocLinks value={a.prdp_url} label="PrDP" /></li>}
                            {a.commercial_insurance_url?.trim() && <li><DocLinks value={a.commercial_insurance_url} label="Commercial insurance" /></li>}
                            {a.signed_contract_url?.trim() && <li><DocLinks value={a.signed_contract_url} label="Signed driver contract" /></li>}
                            <li>
                              Vehicle documents/photos: {splitDocumentUrls(a.vehicle_photos_urls).map((url, i) => (
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
