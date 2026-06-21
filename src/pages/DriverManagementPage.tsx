import { Fragment, useEffect, useMemo, useState } from 'react';
import { getDrivers, type DriverRow } from '../api/admin';
import styles from './DriverManagementPage.module.css';

type ExpiryState = 'expired' | 'soon' | 'valid' | 'missing';

const vehicleDocLabels = ['Double disc', 'Exterior photo', 'Interior photo', 'Vehicle registration / logbook'];

function display(value: unknown, fallback = 'Not captured') {
  const text = value == null ? '' : String(value).trim();
  return text || fallback;
}

function fullName(driver: DriverRow) {
  const fromUser = `${driver.first_name || ''} ${driver.last_name || ''}`.trim();
  return fromUser || driver.application?.full_name || 'Unnamed driver';
}

function splitUrls(value?: string | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not captured';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getExpiryState(value?: string | null): ExpiryState {
  if (!value) return 'missing';
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return 'missing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'valid';
}

function expiryLabel(value?: string | null) {
  const state = getExpiryState(value);
  if (state === 'expired') return 'Expired';
  if (state === 'soon') return 'Expiring soon';
  if (state === 'valid') return 'Valid';
  return 'No expiry date';
}

function expiryClass(state: ExpiryState) {
  if (state === 'expired') return styles.dangerPill;
  if (state === 'soon') return styles.warningPill;
  if (state === 'valid') return styles.okPill;
  return styles.neutralPill;
}

function toWhatsAppPhone(phone?: string | null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `27${digits.slice(1)}`;
  return digits;
}

function driverNeedsAttention(driver: DriverRow) {
  const state = getExpiryState(driver.application?.license_expiry_date || driver.license_expiry_date);
  return state === 'expired' || state === 'soon';
}

function DocumentLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null;
  return (
    <a className={styles.docLink} href={url} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function DriverDetails({ driver }: { driver: DriverRow }) {
  const app = driver.application;
  const bank = driver.banking;
  const vehicleDocs = splitUrls(app?.vehicle_photos_urls);

  return (
    <div className={styles.detailsPanel}>
      <div className={styles.detailsGrid}>
        <section>
          <h3 className={styles.sectionTitle}>Driver info</h3>
          <p className={styles.field}>
            <strong>Name:</strong> {fullName(driver)}
          </p>
          <p className={styles.field}>
            <strong>Email:</strong> {display(driver.email)}
          </p>
          <p className={styles.field}>
            <strong>Phone:</strong> {display(driver.phone)}
          </p>
          <p className={styles.field}>
            <strong>Address:</strong> {display(app?.address)}
          </p>
          <p className={styles.field}>
            <strong>Country of birth:</strong> {display(app?.country_of_birth)}
          </p>
          <p className={styles.field}>
            <strong>Application status:</strong> {display(app?.status || driver.application_status)}
          </p>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Vehicle</h3>
          <p className={styles.field}>
            <strong>Vehicle:</strong> {display(`${driver.vehicle_year || ''} ${driver.vehicle_make || ''} ${driver.vehicle_model || ''}`.trim())}
          </p>
          <p className={styles.field}>
            <strong>Colour:</strong> {display(driver.vehicle_color)}
          </p>
          <p className={styles.field}>
            <strong>Plate:</strong> {display(driver.vehicle_plate_number)}
          </p>
          <p className={styles.field}>
            <strong>Licence number:</strong> {display(driver.license_number)}
          </p>
          <p className={styles.field}>
            <strong>Licence expiry:</strong> {formatDate(app?.license_expiry_date || driver.license_expiry_date)}
          </p>
          <p className={styles.field}>
            <strong>Availability:</strong> {driver.is_available ? 'Online / available' : 'Offline'}
          </p>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Banking details</h3>
          <p className={styles.field}>
            <strong>Bank:</strong> {display(bank?.bank_name)}
          </p>
          <p className={styles.field}>
            <strong>Account holder:</strong> {display(bank?.account_holder_name)}
          </p>
          <p className={styles.field}>
            <strong>Account number:</strong> {display(bank?.account_number)}
          </p>
          <p className={styles.field}>
            <strong>Account type:</strong> {display(bank?.account_type)}
          </p>
          <p className={styles.field}>
            <strong>Branch code:</strong> {display(bank?.branch_code)}
          </p>
          <p className={styles.field}>
            <strong>Verified:</strong> {bank?.verified ? 'Yes' : 'No'}
          </p>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Documents</h3>
          <div className={styles.docList}>
            <DocumentLink label="ID document" url={app?.id_document_url} />
            <DocumentLink label="Selfie / profile photo" url={app?.selfie_url} />
            <DocumentLink label="Driver licence" url={app?.drivers_license_url} />
            <DocumentLink label="PrDP" url={app?.prdp_url} />
            <DocumentLink label="Signed contract" url={app?.signed_contract_url} />
            {vehicleDocs.map((url, index) => (
              <DocumentLink key={`${url}-${index}`} label={vehicleDocLabels[index] || `Vehicle document ${index + 1}`} url={url} />
            ))}
            {!app && <span className={styles.muted}>No application file found for this driver yet.</span>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DriverManagementPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getDrivers({ limit: 500 })
      .then((result) => {
        if (!mounted) return;
        setDrivers(result.drivers);
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || 'Could not load drivers');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredDrivers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return drivers.filter((driver) => {
      const haystack = [
        fullName(driver),
        driver.email,
        driver.phone,
        driver.vehicle_plate_number,
        driver.license_number,
        driver.banking?.account_number,
        driver.banking?.bank_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (term && !haystack.includes(term)) return false;
      if (filter === 'expiring') return driverNeedsAttention(driver);
      if (filter === 'expired') return getExpiryState(driver.application?.license_expiry_date || driver.license_expiry_date) === 'expired';
      if (filter === 'missing-banking') return !driver.banking?.account_number;
      return true;
    });
  }, [drivers, filter, query]);

  const expiringCount = drivers.filter(driverNeedsAttention).length;
  const missingBankingCount = drivers.filter((driver) => !driver.banking?.account_number).length;
  const onlineCount = drivers.filter((driver) => driver.is_available).length;

  const buildMessage = (driver: DriverRow) =>
    encodeURIComponent(
      `Hello ${fullName(driver)}, Hamba Rides needs you to update your driver documents. Please contact support so we can keep your profile active.`
    );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Driver Management</h1>
          <p className={styles.subtitle}>
            View each driver's contact details, vehicle file, documents and banking details in one place.
          </p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total drivers</p>
          <p className={styles.summaryValue}>{drivers.length}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Online now</p>
          <p className={styles.summaryValue}>{onlineCount}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Documents to check</p>
          <p className={styles.summaryValue}>{expiringCount}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Missing banking</p>
          <p className={styles.summaryValue}>{missingBankingCount}</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, phone, plate, licence or bank details"
        />
        <select className={styles.select} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All drivers</option>
          <option value="expiring">Documents expiring soon</option>
          <option value="expired">Expired documents</option>
          <option value="missing-banking">Missing banking details</option>
        </select>
      </div>

      <div className={styles.panel}>
        {loading ? (
          <div className={styles.loading}>Loading driver files...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : filteredDrivers.length === 0 ? (
          <div className={styles.empty}>No drivers match this view.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Contact</th>
                <th>Vehicle</th>
                <th>Documents</th>
                <th>Banking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => {
                const expiryDate = driver.application?.license_expiry_date || driver.license_expiry_date;
                const state = getExpiryState(expiryDate);
                const whatsAppPhone = toWhatsAppPhone(driver.phone);
                const emailSubject = encodeURIComponent('Hamba Rides driver document update');
                const emailBody = encodeURIComponent(
                  `Hello ${fullName(driver)},\n\nPlease update your Hamba Rides driver documents so your profile can stay active.\n\nThank you.`
                );
                const isExpanded = expanded === driver.id;

                return (
                  <Fragment key={driver.id}>
                    <tr>
                      <td>
                        <div className={styles.name}>{fullName(driver)}</div>
                        <div className={styles.muted}>Driver ID: {driver.id}</div>
                        <div className={driver.is_available ? styles.okPill : styles.neutralPill}>
                          {driver.is_available ? 'Online' : 'Offline'}
                        </div>
                      </td>
                      <td>
                        <div>{display(driver.email)}</div>
                        <div className={styles.muted}>{display(driver.phone)}</div>
                      </td>
                      <td>
                        <div>{display(`${driver.vehicle_year || ''} ${driver.vehicle_make || ''} ${driver.vehicle_model || ''}`.trim())}</div>
                        <div className={styles.muted}>{display(driver.vehicle_plate_number)}</div>
                      </td>
                      <td>
                        <div className={expiryClass(state)}>{expiryLabel(expiryDate)}</div>
                        <div className={styles.muted}>Licence expiry: {formatDate(expiryDate)}</div>
                      </td>
                      <td>
                        <div>{display(driver.banking?.bank_name)}</div>
                        <div className={styles.muted}>{display(driver.banking?.account_number)}</div>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.button}
                            onClick={() => setExpanded(isExpanded ? null : driver.id)}
                          >
                            {isExpanded ? 'Hide file' : 'Open file'}
                          </button>
                          {driver.email ? (
                            <a className={styles.linkButton} href={`mailto:${driver.email}?subject=${emailSubject}&body=${emailBody}`}>
                              Email
                            </a>
                          ) : null}
                          {whatsAppPhone ? (
                            <a
                              className={styles.linkButton}
                              href={`https://wa.me/${whatsAppPhone}?text=${buildMessage(driver)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className={styles.detailsRow}>
                        <td colSpan={6}>
                          <DriverDetails driver={driver} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
