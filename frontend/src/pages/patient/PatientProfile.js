import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getInitials, formatDate } from '../../utils/helpers';
import Modal from '../../components/common/Modal';

const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [form, setForm] = useState({});
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});

  useEffect(() => {
    api.get('/patients/profile')
      .then(res => { setPatient(res.data.patient); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openEdit = () => {
    setForm({
      firstName: user?.firstName || '', lastName: user?.lastName || '',
      phone: user?.phone || '', profileImage: user?.profileImage || '',
      dateOfBirth: patient?.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient?.gender || '', bloodGroup: patient?.bloodGroup || '',
      weight: patient?.weight || '', height: patient?.height || '',
      allergies: patient?.allergies?.join(', ') || '',
      chronicConditions: patient?.chronicConditions?.join(', ') || '',
      emergencyName: patient?.emergencyContact?.name || '',
      emergencyRelationship: patient?.emergencyContact?.relationship || '',
      emergencyPhone: patient?.emergencyContact?.phone || ''
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone, profileImage: form.profileImage,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender, bloodGroup: form.bloodGroup,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContact: {
          name: form.emergencyName, relationship: form.emergencyRelationship, phone: form.emergencyPhone
        }
      };
      const res = await api.put('/patients/profile', payload);
      setPatient(res.data.patient);
      updateUser({ firstName: form.firstName, lastName: form.lastName, phone: form.phone, profileImage: form.profileImage });
      toast.success('Profile updated!');
      setEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    const e = {};
    if (!pwdForm.currentPassword) e.currentPassword = 'Required';
    if (pwdForm.newPassword.length < 6) e.newPassword = 'Min 6 characters';
    if (pwdForm.newPassword !== pwdForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (Object.keys(e).length > 0) { setPwdErrors(e); return; }
    setSaving(true);
    try {
      await api.put('/auth/update-password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed!');
      setPwdModal(false);
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /></div>;

  const doctor = patient?.doctor;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your personal health information</p></div>
        <button className="btn btn-primary" onClick={openEdit}>✏️ Edit Profile</button>
      </div>

      {/* Profile Header */}
      <div className="profile-header mb-6">
        <div className="avatar xl">
          {user?.profileImage ? <img src={user.profileImage} alt="" /> : getInitials(user?.firstName, user?.lastName)}
        </div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{user?.firstName} {user?.lastName}</h2>
          <p style={{ opacity: 0.85, marginBottom: 4 }}>@{user?.username}</p>
          <p style={{ opacity: 0.7, fontSize: 14 }}>{user?.email}</p>
          {patient?.bloodGroup && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 12px', fontSize: 13, backdropFilter: 'blur(4px)' }}>
              🩸 Blood Group: <strong>{patient.bloodGroup}</strong>
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {patient?.age && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{patient.age}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Years Old</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 mb-4">
        {/* Personal Info */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Personal Information</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Full Name', value: `${user?.firstName} ${user?.lastName}` },
              { label: 'Username', value: `@${user?.username}` },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone || '—' },
              { label: 'Date of Birth', value: patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : '—' },
              { label: 'Gender', value: patient?.gender ? patient.gender.replace(/_/g, ' ') : '—' },
              { label: 'Blood Group', value: patient?.bloodGroup || '—' },
              { label: 'Weight', value: patient?.weight ? `${patient.weight} kg` : '—' },
              { label: 'Height', value: patient?.height ? `${patient.height} cm` : '—' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Doctor */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">My Doctor</h3></div>
            {doctor ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{ background: 'var(--gradient-primary)' }}>
                  {doctor.user?.profileImage ? <img src={doctor.user.profileImage} alt="" /> : getInitials(doctor.user?.firstName, doctor.user?.lastName)}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Dr. {doctor.user?.firstName} {doctor.user?.lastName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doctor.specialization || 'General Practitioner'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doctor.user?.email}</div>
                </div>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Active</span>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍⚕️</div>
                No doctor assigned yet
              </div>
            )}
          </div>

          {/* Medical Info */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Medical Information</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Allergies</div>
                {patient?.allergies?.length > 0
                  ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {patient.allergies.map(a => <span key={a} className="badge badge-danger">{a}</span>)}
                    </div>
                  : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None reported</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Chronic Conditions</div>
                {patient?.chronicConditions?.length > 0
                  ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {patient.chronicConditions.map(c => <span key={c} className="badge badge-warning">{c}</span>)}
                    </div>
                  : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None reported</span>
                }
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {patient?.emergencyContact?.name && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">Emergency Contact</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 600 }}>{patient.emergencyContact.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{patient.emergencyContact.relationship}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{patient.emergencyContact.phone}</div>
              </div>
            </div>
          )}

          {/* Security */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Security</h3></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Password</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Change your account password</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setPwdModal(true)}>Change</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profile" size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="loading-spinner" /> Saving...</> : 'Save Changes'}
          </button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">First Name</label><input className="form-control" value={form.firstName || ''} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-control" value={form.dateOfBirth || ''} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-control" value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select...</option>
              <option value="male">Male</option><option value="female">Female</option>
              <option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select className="form-control" value={form.bloodGroup || ''} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
              <option value="">Select...</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Weight (kg)</label><input type="number" className="form-control" value={form.weight || ''} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Height (cm)</label><input type="number" className="form-control" value={form.height || ''} onChange={e => setForm({ ...form, height: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Allergies (comma separated)</label><input className="form-control" placeholder="e.g., Penicillin, Aspirin" value={form.allergies || ''} onChange={e => setForm({ ...form, allergies: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Chronic Conditions (comma separated)</label><input className="form-control" placeholder="e.g., Diabetes, Hypertension" value={form.chronicConditions || ''} onChange={e => setForm({ ...form, chronicConditions: e.target.value })} /></div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Emergency Contact</div>
          <div className="form-row-3">
            <div className="form-group"><label className="form-label">Name</label><input className="form-control" value={form.emergencyName || ''} onChange={e => setForm({ ...form, emergencyName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Relationship</label><input className="form-control" value={form.emergencyRelationship || ''} onChange={e => setForm({ ...form, emergencyRelationship: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.emergencyPhone || ''} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} /></div>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Profile Image URL</label><input className="form-control" placeholder="https://..." value={form.profileImage || ''} onChange={e => setForm({ ...form, profileImage: e.target.value })} /></div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={pwdModal} onClose={() => { setPwdModal(false); setPwdErrors({}); }} title="Change Password" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setPwdModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handlePasswordChange} disabled={saving}>
            {saving ? <span className="loading-spinner" /> : 'Change Password'}
          </button>
        </>}
      >
        <div className="form-group"><label className="form-label">Current Password</label><input type="password" className={`form-control ${pwdErrors.currentPassword ? 'error' : ''}`} value={pwdForm.currentPassword} onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} />{pwdErrors.currentPassword && <span className="form-error">{pwdErrors.currentPassword}</span>}</div>
        <div className="form-group"><label className="form-label">New Password</label><input type="password" className={`form-control ${pwdErrors.newPassword ? 'error' : ''}`} value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />{pwdErrors.newPassword && <span className="form-error">{pwdErrors.newPassword}</span>}</div>
        <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" className={`form-control ${pwdErrors.confirmPassword ? 'error' : ''}`} value={pwdForm.confirmPassword} onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />{pwdErrors.confirmPassword && <span className="form-error">{pwdErrors.confirmPassword}</span>}</div>
      </Modal>
    </div>
  );
};

export default PatientProfile;
