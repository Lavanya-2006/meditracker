import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { getInitials, formatDate } from '../../utils/helpers';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [addModal, setAddModal] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [patientMeds, setPatientMeds] = useState([]);

// eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchPatients = useCallback(async (page = 1, searchVal = search) => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/patients', { params: { page, limit: 10, search: searchVal } });
      setPatients(res.data.patients);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { 
  fetchPatients(1, ''); 
}, [fetchPatients]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchPatients(1, val);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!patientEmail.trim()) return;
    setAddLoading(true);
    try {
      // const res = await api.post('/doctors/patients/add', { patientEmail });
     await api.post('/doctors/patients/add', { patientEmail });
      toast.success('Patient added successfully!');
      setAddModal(false);
      setPatientEmail('');
      fetchPatients(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add patient');
    } finally { setAddLoading(false); }
  };

  const handleRemove = async () => {
    if (!removeConfirm) return;
    setRemoveLoading(true);
    try {
      await api.delete(`/doctors/patients/${removeConfirm._id}`);
      toast.success('Patient removed');
      setRemoveConfirm(null);
      fetchPatients(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove patient');
    } finally { setRemoveLoading(false); }
  };

  const handleViewPatient = async (patient) => {
    setViewPatient(patient);
    try {
      const res = await api.get(`/medicines/patient/${patient._id}`);
      setPatientMeds(res.data.medicines);
    } catch { setPatientMeds([]); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Patients</h1>
          <p className="page-subtitle">{pagination.total} patient{pagination.total !== 1 ? 's' : ''} assigned</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>➕ Add Patient</button>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="form-control search-input"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /></div>
      ) : patients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>{search ? 'No patients found' : 'No patients yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Add a registered patient using their email address'}</p>
            {!search && <button className="btn btn-primary" onClick={() => setAddModal(true)}>Add First Patient</button>}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {patients.map(patient => (
              <div key={patient._id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div className="avatar" style={{ background: 'var(--gradient-primary)', flexShrink: 0 }}>
                    {patient.user?.profileImage
                      ? <img src={patient.user.profileImage} alt="" />
                      : getInitials(patient.user?.firstName, patient.user?.lastName)
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{patient.user?.firstName} {patient.user?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.user?.email}</div>
                    {patient.user?.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{patient.user.phone}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {patient.gender && <span className="badge badge-secondary">{patient.gender}</span>}
                  {patient.bloodGroup && <span className="badge badge-info">{patient.bloodGroup}</span>}
                  {patient.age && <span className="badge badge-secondary">{patient.age} yrs</span>}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Added: {formatDate(patient.createdAt)}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleViewPatient(patient)}>View Details</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setRemoveConfirm(patient)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={(p) => fetchPatients(p)} />
        </>
      )}

      {/* Add Patient Modal */}
      <Modal isOpen={addModal} onClose={() => { setAddModal(false); setPatientEmail(''); }} title="Add Patient" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddPatient} disabled={addLoading || !patientEmail.trim()}>
            {addLoading ? <span className="loading-spinner" /> : 'Add Patient'}
          </button>
        </>}
      >
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Enter the email address of a registered patient to add them to your practice.
        </p>
        <div className="form-group">
          <label className="form-label">Patient Email Address</label>
          <input
            type="email"
            className="form-control"
            placeholder="patient@example.com"
            value={patientEmail}
            onChange={e => setPatientEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPatient(e)}
            autoFocus
          />
        </div>
        <div style={{ background: 'rgba(79,110,247,0.06)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
          ℹ️ Patient must already be registered in MediTracker and must not be assigned to another doctor.
        </div>
      </Modal>

      {/* View Patient Modal */}
      <Modal isOpen={!!viewPatient} onClose={() => setViewPatient(null)} title="Patient Details" size="md">
        {viewPatient && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'var(--bg)', borderRadius: 12 }}>
              <div className="avatar lg" style={{ background: 'var(--gradient-primary)' }}>
                {viewPatient.user?.profileImage ? <img src={viewPatient.user.profileImage} alt="" /> : getInitials(viewPatient.user?.firstName, viewPatient.user?.lastName)}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{viewPatient.user?.firstName} {viewPatient.user?.lastName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{viewPatient.user?.email}</p>
                {viewPatient.user?.phone && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{viewPatient.user.phone}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Date of Birth', value: viewPatient.dateOfBirth ? formatDate(viewPatient.dateOfBirth) : '—' },
                { label: 'Age', value: viewPatient.age ? `${viewPatient.age} years` : '—' },
                { label: 'Gender', value: viewPatient.gender || '—' },
                { label: 'Blood Group', value: viewPatient.bloodGroup || '—' },
                { label: 'Weight', value: viewPatient.weight ? `${viewPatient.weight} kg` : '—' },
                { label: 'Height', value: viewPatient.height ? `${viewPatient.height} cm` : '—' }
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {viewPatient.allergies?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Allergies</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewPatient.allergies.map(a => <span key={a} className="badge badge-danger">{a}</span>)}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
                Current Medicines ({patientMeds.length})
              </div>
              {patientMeds.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {patientMeds.slice(0, 5).map(m => (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color || 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{m.dosage?.amount} {m.dosage?.unit}</span>
                      </div>
                      <span className={`badge ${m.isActive ? 'badge-success' : 'badge-secondary'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No medicines prescribed yet</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Confirm */}
      <ConfirmDialog
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={handleRemove}
        title="Remove Patient"
        message={`Are you sure you want to remove ${removeConfirm?.user?.firstName} ${removeConfirm?.user?.lastName} from your patient list? They will be unassigned from your practice.`}
        confirmLabel="Remove Patient"
        danger
        loading={removeLoading}
      />
    </div>
  );
};

export default DoctorPatients;
