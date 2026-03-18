import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import styles from './PayoutsManagementPage.module.css';

interface Driver {
  driver_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_earned: number;
  total_paid_out: number;
  available_balance: number;
  total_rides: number;
  last_payout_date: string | null;
}

interface PayoutDetails {
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    total_earned: number;
    total_paid_out: number;
    available_balance: number;
    total_rides_completed: number;
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
      const response = await adminApi.get('/payouts/pending');
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (driverId: string) => {
    try {
      const response = await adminApi.get(`/payouts/${driverId}/details`);
      setSelectedDriver(response.data);
      setPayoutAmount(response.data.driver.available_balance.toString());
      setShowPayoutModal(true);
    } catch (error) {
      console.error('Failed to load payout details:', error);
      alert('Failed to load payout details');
    }
  };

  const handleProcessPayout = async () => {
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

    if (!confirm(`Process payout of R${amount.toFixed(2)} to ${selectedDriver.driver.first_name} ${selectedDriver.driver.last_name}?`)) {
      return;
    }

    try {
      setProcessingPayout(true);
      await adminApi.post(`/payouts/${selectedDriver.driver.id}/process`, {
        amount,
        notes: payoutNotes
      });
      alert('Payout processed successfully!');
      setShowPayoutModal(false);
      setSelectedDriver(null);
      setPayoutAmount('');
      setPayoutNotes('');
      loadDrivers();
    } catch (error: any) {
      console.error('Failed to process payout:', error);
      alert(error.response?.data?.error || 'Failed to process payout');
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
        <p className={styles.subtitle}>Manage driver earnings and process payouts</p>
      </div>

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
              <th>Driver Name</th>
              <th>Email</th>
              <th>Total Rides</th>
              <th>Total Earned</th>
              <th>Paid Out</th>
              <th>Available Balance</th>
              <th>Last Payout</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  No pending payouts
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.driver_id}>
                  <td>{driver.first_name} {driver.last_name}</td>
                  <td>{driver.email}</td>
                  <td>{driver.total_rides}</td>
                  <td>{formatCurrency(driver.total_earned)}</td>
                  <td>{formatCurrency(driver.total_paid_out)}</td>
                  <td className={styles.balanceCell}>
                    {formatCurrency(driver.available_balance)}
                  </td>
                  <td>{formatDate(driver.last_payout_date)}</td>
                  <td>
                    <button
                      className={styles.payButton}
                      onClick={() => handlePayNow(driver.driver_id)}
                    >
                      Pay Now
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
                    <span>Total Earned:</span>
                    <span>{formatCurrency(selectedDriver.driver.total_earned)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Previous Payouts:</span>
                    <span>-{formatCurrency(selectedDriver.driver.total_paid_out)}</span>
                  </div>
                  <div className={styles.breakdownRow + ' ' + styles.total}>
                    <span>Available Balance:</span>
                    <span>{formatCurrency(selectedDriver.driver.available_balance)}</span>
                  </div>
                </div>
              </div>

              {selectedDriver.banking ? (
                <div className={styles.section}>
                  <h3>Banking Details</h3>
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
                      <span>****{selectedDriver.banking.account_number.slice(-4)}</span>
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
                <div className={styles.warning}>
                  ⚠️ No banking details on file
                </div>
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
                onClick={handleProcessPayout}
                disabled={processingPayout || !selectedDriver.banking}
              >
                {processingPayout ? 'Processing...' : `Confirm Payout - ${formatCurrency(parseFloat(payoutAmount) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
