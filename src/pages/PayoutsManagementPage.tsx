import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { api } from '../api/client';
import styles from './PayoutsManagementPage.module.css';

interface Driver {
  driver_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_earned: number;
  gross_fares?: number;
  driver_take_home?: number;
  total_paid_out: number;
  available_balance: number;
  amount_owed_from_cash_rides: number;
  cash_commission_remaining_from_cash_rides?: number;
  total_rides: number;
  last_payout_date: string | null;
  banking: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    account_type: string;
    branch_code: string;
    verified: boolean;
  } | null;
}

interface PayoutDetails {
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    total_earned: number;
    gross_fares?: number;
    driver_take_home?: number;
    total_paid_out: number;
    available_balance: number;
    total_rides_completed: number;
    amount_owed_from_cash_rides: number;
    cash_commission_remaining_from_cash_rides?: number;
  };
  banking: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    account_type: string;
    branch_code: string;
    verified: boolean;
  } | null;
  previousPayouts: Array<{
    id: string;
    amount: number;
    payment_date: string;
    payment_reference: string;
    status: string;
  }>;
}

export default function PayoutsManagementPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<PayoutDetails | null>(null);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await api.get('/admin/payouts/pending');
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      setDrivers([]);
      const msg = isAxiosError(error)
        ? String(error.response?.data?.error || error.response?.data?.message || error.message || 'Request failed')
        : 'Could not load pending payouts';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (driverId: string) => {
    try {
      const response = await api.get(`/admin/payouts/${driverId}/details`);
      setSelectedDriver(response.data);
      setPayoutAmount(response.data.driver.available_balance.toString());
      setShowPayoutModal(true);
    } catch (error) {
      console.error('Failed to load payout details:', error);
      alert('Failed to load payout details');
    }
  };

  const handleRecordEftPayment = async () => {
    if (!selectedDriver) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > selectedDriver.driver.available_balance) {
      alert('Amount exceeds available balance');
      return;
    }

    if (!selectedDriver.banking) {
      alert('Driver has no banking details on file');
      return;
    }

    if (!confirm(`Has the EFT of R${amount.toFixed(2)} already been sent to ${selectedDriver.driver.first_name} ${selectedDriver.driver.last_name}? This will create a receipt for the driver.`)) {
      return;
    }

    try {
      setProcessingPayout(true);
      await api.post(`/admin/payouts/${selectedDriver.driver.id}/process`, {
        amount,
        notes: payoutNotes
      });
      alert('EFT payment recorded. The driver can now view their payout receipt.');
      setShowPayoutModal(false);
      setSelectedDriver(null);
      setPayoutAmount('');
      setPayoutNotes('');
      loadDrivers();
    } catch (error) {
      console.error('Failed to process payout:', error);
      alert(isAxiosError(error) ? error.response?.data?.error || 'Failed to record EFT payment' : 'Failed to record EFT payment');
    } finally {
      setProcessingPayout(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading payouts...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Driver Payouts</h1>
        <p className={styles.subtitle}>
          <strong>Take-home</strong> is what the driver keeps (~79% of fares). For cash rides they already have that
          money, so <strong>bank payout owed</strong> is R0. <strong>Cash commission</strong> is the 21% they still owe
          the platform.
        </p>
      </div>

      {loadError && (
        <p className={styles.apiError} role="alert">
          Could not load payouts: {loadError}. Set <code>SUPABASE_SERVICE_KEY</code> on the API and verify{' '}
          <code>/health</code> shows <code>service_role</code>.
        </p>
      )}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Pending</div>
          <div className={styles.statValue}>
            {formatCurrency(drivers.reduce((sum, d) => sum + d.available_balance, 0))}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Drivers with Balance</div>
          <div className={styles.statValue}>{drivers.length}</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Bank payout owed</th>
              <th>Cash commission owed</th>
              <th>Bank</th>
              <th>Account holder</th>
              <th>Account number</th>
              <th>Branch</th>
              <th>Type</th>
              <th>Last payout</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.emptyState}>
                  {loadError ? 'Failed to load — see message above' : 'No pending payouts'}
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.driver_id}>
                  <td>
                    <div className={styles.driverName}>
                      {driver.first_name} {driver.last_name}
                    </div>
                    <div className={styles.driverEmail}>{driver.email}</div>
                    <div className={styles.miniNote}>
                      {driver.total_rides} rides · take-home {formatCurrency(driver.driver_take_home ?? 0)}
                      {driver.gross_fares ? ` · fares ${formatCurrency(driver.gross_fares)}` : ''}
                    </div>
                  </td>
                  <td className={styles.balanceCell}>{formatCurrency(driver.available_balance)}</td>
                  <td>
                    {formatCurrency(driver.amount_owed_from_cash_rides || 0)}
                    {driver.cash_commission_remaining_from_cash_rides ? (
                      <div className={styles.miniNote}>
                        Still owed to platform: {formatCurrency(driver.cash_commission_remaining_from_cash_rides)}
                      </div>
                    ) : null}
                  </td>
                  <td className={styles.bankingCell}>{driver.banking?.bank_name || 'Missing'}</td>
                  <td className={styles.bankingCell}>{driver.banking?.account_holder_name || '—'}</td>
                  <td className={styles.accountNumber}>{driver.banking?.account_number || '—'}</td>
                  <td className={styles.bankingCell}>{driver.banking?.branch_code || '—'}</td>
                  <td className={styles.bankingCell}>{driver.banking?.account_type || '—'}</td>
                  <td>{formatDate(driver.last_payout_date)}</td>
                  <td>
                    <button
                      className={styles.payButton}
                      onClick={() => handlePayNow(driver.driver_id)}
                      disabled={!driver.banking?.account_number}
                      title={
                        driver.banking?.account_number
                          ? 'Open payout with full banking details'
                          : 'Driver has no banking details on file'
                      }
                    >
                      {driver.banking?.account_number ? 'Pay now' : 'No bank details'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPayoutModal && selectedDriver && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Process Payout - {selectedDriver.driver.first_name} {selectedDriver.driver.last_name}</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowPayoutModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.section}>
                <h3>Earnings Breakdown</h3>
                <div className={styles.breakdown}>
                  <div className={styles.breakdownRow}>
                    <span>Total Rides:</span>
                    <span>{selectedDriver.driver.total_rides_completed}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Gross fares (riders paid):</span>
                    <span>{formatCurrency(selectedDriver.driver.gross_fares || 0)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Driver take-home (~79%):</span>
                    <span>{formatCurrency(selectedDriver.driver.driver_take_home || 0)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Bank payout owed (card/EFT net):</span>
                    <span>{formatCurrency(selectedDriver.driver.total_earned)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Previous Payouts:</span>
                    <span>-{formatCurrency(selectedDriver.driver.total_paid_out)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Cash commission (21% driver owes you):</span>
                    <span>{formatCurrency(selectedDriver.driver.amount_owed_from_cash_rides || 0)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Cash commission still outstanding:</span>
                    <span>{formatCurrency(selectedDriver.driver.cash_commission_remaining_from_cash_rides || 0)}</span>
                  </div>
                  <div className={styles.breakdownRow + ' ' + styles.total}>
                    <span>Available for EFT:</span>
                    <span>{formatCurrency(selectedDriver.driver.available_balance)}</span>
                  </div>
                </div>
              </div>

              {selectedDriver.banking ? (
                <div className={styles.section}>
                  <h3>Banking details for EFT</h3>
                  <div className={styles.bankingDetails}>
                    <div className={styles.detailRow}>
                      <span>Bank:</span>
                      <span>{selectedDriver.banking.bank_name}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Account Holder:</span>
                      <span>{selectedDriver.banking.account_holder_name}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Account Number:</span>
                      <span className={styles.accountNumber}>{selectedDriver.banking.account_number}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Account Type:</span>
                      <span className={styles.capitalize}>{selectedDriver.banking.account_type}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Branch Code:</span>
                      <span>{selectedDriver.banking.branch_code}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.warning}>No banking details on file — cannot process payout</div>
              )}

              {selectedDriver.previousPayouts.length > 0 && (
                <div className={styles.section}>
                  <h3>Previous Payouts</h3>
                  <div className={styles.previousPayouts}>
                    {selectedDriver.previousPayouts.slice(0, 5).map((payout) => (
                      <div key={payout.id} className={styles.payoutRow}>
                        <span>{formatDate(payout.payment_date)}</span>
                        <span>{formatCurrency(payout.amount)}</span>
                        <span className={styles.reference}>{payout.payment_reference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.section}>
                <h3>Payout Amount</h3>
                <input
                  type="number"
                  className={styles.input}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  max={selectedDriver.driver.available_balance}
                />
              </div>

              <div className={styles.section}>
                <h3>Notes (Optional)</h3>
                <textarea
                  className={styles.textarea}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Add any notes about this payout..."
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowPayoutModal(false)}
                disabled={processingPayout}
              >
                Cancel
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleRecordEftPayment}
                disabled={processingPayout || !selectedDriver.banking}
              >
                {processingPayout ? 'Recording...' : `Mark EFT Paid & Send Receipt - ${formatCurrency(parseFloat(payoutAmount) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
