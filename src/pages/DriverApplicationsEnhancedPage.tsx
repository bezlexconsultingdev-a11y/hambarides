import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './DriverApplicationsEnhancedPage.css';

interface DriverApplication {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate_number: string;
  vehicle_type: 'economy' | 'standard';
  vehicle_photos: string[];
  profile_photo_url?: string;
  verification_status: 'pending' | 'approved' | 'declined';
  submitted_at: string;
  country_of_birth?: string;
  address?: string;
}

export default function DriverApplicationsEnhancedPage() {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user details for each driver
      const driversWithUsers = await Promise.all(
        (data || []).map(async (driver) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email, phone, first_name, last_name')
            .eq('id', driver.user_id)
            .single();

          return {
            ...driver,
            email: userData?.email || '',
            phone: userData?.phone || '',
            full_name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
          };
        })
      );

      setApplications(driversWithUsers);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: DriverApplication) => {
    if (!confirm(`Approve driver application for ${application.full_name}?`)) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          verification_status: 'approved',
          is_available: false,
        })
        .eq('id', application.id);

      if (error) throw error;

      alert('Driver approved successfully!');
      setSelectedApp(null);
      loadApplications();
    } catch (error: any) {
      alert('Error approving driver: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (application: DriverApplication) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining.');
      return;
    }

    if (!confirm(`Decline driver application for ${application.full_name}?`)) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          verification_status: 'declined',
        })
        .eq('id', application.id);

      if (error) throw error;

      // TODO: Send email notification with decline reason

      alert('Driver application declined.');
      setSelectedApp(null);
      setDeclineReason('');
      loadApplications();
    } catch (error: any) {
      alert('Error declining driver: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const openPhotoGallery = (app: DriverApplication, index: number = 0) => {
    setSelectedApp(app);
    setSelectedPhotoIndex(index);
    setPhotoGalleryOpen(true);
  };

  const closePhotoGallery = () => {
    setPhotoGalleryOpen(false);
    setSelectedPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (selectedApp && selectedApp.vehicle_photos) {
      setSelectedPhotoIndex((prev) =>
        prev < selectedApp.vehicle_photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevPhoto = () => {
    if (selectedApp && selectedApp.vehicle_photos) {
      setSelectedPhotoIndex((prev) =>
        prev > 0 ? prev - 1 : selectedApp.vehicle_photos.length - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1>Driver Applications</h1>
        <p className="subtitle">Review and approve pending driver applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Pending Applications</h2>
          <p>All driver applications have been reviewed.</p>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="card-header">
                <div className="driver-info">
                  {app.profile_photo_url ? (
                    <img
                      src={app.profile_photo_url}
                      alt={app.full_name}
                      className="profile-photo"
                    />
                  ) : (
                    <div className="profile-photo-placeholder">
                      {app.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3>{app.full_name}</h3>
                    <p className="email">{app.email}</p>
                    <p className="phone">{app.phone}</p>
                  </div>
                </div>
                <span className={`badge badge-${app.vehicle_type}`}>
                  {app.vehicle_type.toUpperCase()}
                </span>
              </div>

              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>License Number</label>
                    <span>{app.license_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Vehicle</label>
                    <span>
                      {app.vehicle_color} {app.vehicle_make} {app.vehicle_model} ({app.vehicle_year})
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Plate Number</label>
                    <span>{app.vehicle_plate_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Submitted</label>
                    <span>{new Date(app.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Vehicle Photos */}
                {app.vehicle_photos && app.vehicle_photos.length > 0 && (
                  <div className="vehicle-photos-section">
                    <label>Vehicle Photos ({app.vehicle_photos.length})</label>
                    <div className="photo-thumbnails">
                      {app.vehicle_photos.map((photo, index) => (
                        <div
                          key={index}
                          className="photo-thumbnail"
                          onClick={() => openPhotoGallery(app, index)}
                        >
                          <img src={photo} alt={`Vehicle ${index + 1}`} />
                          <div className="photo-overlay">
                            <span>View</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedApp(app)}
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && !photoGalleryOpen && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Application</h2>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="review-section">
                <h3>{selectedApp.full_name}</h3>
                <p className="text-muted">{selectedApp.email}</p>

                <div className="review-details">
                  <div className="detail-row">
                    <strong>Vehicle:</strong>
                    <span>
                      {selectedApp.vehicle_color} {selectedApp.vehicle_make}{' '}
                      {selectedApp.vehicle_model} ({selectedApp.vehicle_year})
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Classification:</strong>
                    <span className={`badge badge-${selectedApp.vehicle_type}`}>
                      {selectedApp.vehicle_type.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>License:</strong>
                    <span>{selectedApp.license_number}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Plate:</strong>
                    <span>{selectedApp.vehicle_plate_number}</span>
                  </div>
                </div>

                {selectedApp.vehicle_photos && selectedApp.vehicle_photos.length > 0 && (
                  <div className="photos-preview">
                    <strong>Vehicle Photos:</strong>
                    <div className="photo-grid">
                      {selectedApp.vehicle_photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Vehicle ${index + 1}`}
                          onClick={() => openPhotoGallery(selectedApp, index)}
                          className="preview-photo"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="decline-section">
                  <label htmlFor="decline-reason">Decline Reason (if declining):</label>
                  <textarea
                    id="decline-reason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Provide a reason for declining this application..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-danger"
                onClick={() => handleDecline(selectedApp)}
                disabled={processing || !declineReason.trim()}
              >
                {processing ? 'Processing...' : 'Decline'}
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleApprove(selectedApp)}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {photoGalleryOpen && selectedApp && selectedApp.vehicle_photos && (
        <div className="gallery-overlay" onClick={closePhotoGallery}>
          <div className="gallery-content" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-close" onClick={closePhotoGallery}>
              ×
            </button>
            <button className="gallery-nav gallery-prev" onClick={prevPhoto}>
              ‹
            </button>
            <button className="gallery-nav gallery-next" onClick={nextPhoto}>
              ›
            </button>

            <img
              src={selectedApp.vehicle_photos[selectedPhotoIndex]}
              alt={`Vehicle photo ${selectedPhotoIndex + 1}`}
              className="gallery-image"
            />

            <div className="gallery-info">
              Photo {selectedPhotoIndex + 1} of {selectedApp.vehicle_photos.length}
            </div>

            <div className="gallery-thumbnails">
              {selectedApp.vehicle_photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className={`gallery-thumb ${index === selectedPhotoIndex ? 'active' : ''}`}
                  onClick={() => setSelectedPhotoIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
