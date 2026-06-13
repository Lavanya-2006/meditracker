import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getInitials, formatDate } from '../../utils/helpers';
import Modal from '../../components/common/Modal';

const DoctorProfile = () => {
  const { user, updateUser } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [form, setForm] = useState({});
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});

  useEffect(() => {
    api.get('/doctors/profile').then(res => { setDoctor(res.data.doctor); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openEdit = () => {
    setForm({
      firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '',
      specialization: doctor?.specialization || '', licenseNumber: doctor?.licenseNumber || '',
      hospital: doctor?.hospital || '', experience: doctor?.experience || 0, bio: doctor?.bio || '',
      profileImage: user?.profileImage || ''
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/doctors/profile', form);
      setDoctor(res.data.doctor);
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
      toast.success('Password changed successfully!');
      setPwdModal(false);
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your account and practice information</p></div>
        <button className="btn btn-primary" onClick={openEdit}>✏️ Edit Profile</button>
      </div>

      {/* Profile Header */}
      <div className="profile-header mb-6">
        <div className="avatar xl">
          {user?.profileImage ? <img src={user.profileImage} alt="" /> : getInitials(user?.firstName, user?.lastName)}
        </div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dr. {user?.firstName} {user?.lastName}</h2>
          <p style={{ opacity: 0.85, marginBottom: 4 }}>{doctor?.specialization || 'General Practitioner'}</p>
          <p style={{ opacity: 0.7, fontSize: 14 }}>{user?.email}</p>
          {doctor?.hospital && <p style={{ opacity: 0.7, fontSize: 14 }}>🏥 {doctor.hospital}</p>}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(4px)' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{doctor?.patients?.length || 0}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Patients</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Personal Info */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Personal Information</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Username', value: `@${user?.username}` },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone || '—' },
              { label: 'Member Since', value: formatDate(user?.createdAt) },
              { label: 'Last Login', value: user?.lastLogin ? formatDate(user.lastLogin, 'MMM dd, yyyy hh:mm a') : '—' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Practice Info */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Practice Information</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Specialization', value: doctor?.specialization || '—' },
              { label: 'License Number', value: doctor?.licenseNumber || '—' },
              { label: 'Hospital/Clinic', value: doctor?.hospital || '—' },
              { label: 'Experience', value: doctor?.experience ? `${doctor.experience} years` : '—' },
              { label: 'Available Hours', value: doctor?.availableHours ? `${doctor.availableHours.from} - ${doctor.availableHours.to}` : '—' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {doctor?.bio && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">About Me</h3></div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{doctor.bio}</p>
          </div>
        )}

        {/* Security */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Security</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Password</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last changed: Unknown</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setPwdModal(true)}>Change</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Account Role</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Medical Professional</div>
              </div>
              <span className="badge badge-primary">Doctor</span>
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
          <div className="form-group"><label className="form-label">Specialization</label><input className="form-control" value={form.specialization || ''} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">License Number</label><input className="form-control" value={form.licenseNumber || ''} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Hospital/Clinic</label><input className="form-control" value={form.hospital || ''} onChange={e => setForm({ ...form, hospital: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Years of Experience</label><input type="number" min={0} className="form-control" value={form.experience || 0} onChange={e => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} /></div>
          <div className="form-group"><label className="form-label">Profile Image URL</label><input className="form-control" placeholder="https://..." value={form.profileImage || ''} onChange={e => setForm({ ...form, profileImage: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Bio</label><textarea className="form-control" rows={4} value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell your patients about yourself..." /></div>
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

export default DoctorProfile;
