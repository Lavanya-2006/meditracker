import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { getFrequencyLabel, getDosageLabel, formatDate, capitalize, MEDICINE_COLORS } from '../../utils/helpers';

const FREQUENCIES = [
  { value: 'once_daily', label: 'Once Daily' }, { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: '3x Daily' }, { value: 'four_times_daily', label: '4x Daily' },
  { value: 'every_6_hours', label: 'Every 6 Hours' }, { value: 'every_8_hours', label: 'Every 8 Hours' },
  { value: 'every_12_hours', label: 'Every 12 Hours' }, { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' }, { value: 'monthly', label: 'Monthly' },
  { value: 'as_needed', label: 'As Needed' }
];

const DOSAGE_UNITS = ['mg', 'ml', 'g', 'mcg', 'IU', 'tablet', 'capsule', 'drops', 'puff', 'patch'];
const DURATION_UNITS = ['days', 'weeks', 'months', 'ongoing'];
const TIMINGS = ['morning', 'afternoon', 'evening', 'night', 'bedtime'];

const defaultForm = {
  patientId: '', name: '', genericName: '', dosage: { amount: '', unit: 'mg' },
  frequency: 'once_daily', timing: [], duration: { value: 7, unit: 'days' },
  startDate: new Date().toISOString().split('T')[0], beforeFood: false,
  notes: '', precautions: '', sideEffects: '', refillsRemaining: 0,
  isActive: true, color: MEDICINE_COLORS[0]
};

const DoctorMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [modal, setModal] = useState({ open: false, mode: 'add', medicine: null });
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMedicines = useCallback(async (page = 1, s = search, pid = filterPatient) => {
    setLoading(true);
    try {
      const res = await api.get('/medicines', { params: { page, limit: 10, search: s, patientId: pid || undefined } });
      setMedicines(res.data.medicines);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load medicines'); }
    finally { setLoading(false); }
  }, [search, filterPatient]);

  useEffect(() => {
    fetchMedicines();
    api.get('/doctors/patients', { params: { limit: 100 } })
      .then(res => setPatients(res.data.patients))
      .catch(() => {});
  }, []);

  const openAdd = () => { setForm(defaultForm); setFormErrors({}); setModal({ open: true, mode: 'add', medicine: null }); };
  const openEdit = (med) => {
    setForm({
      patientId: med.patient?._id || '',
      name: med.name, genericName: med.genericName || '',
      dosage: med.dosage || { amount: '', unit: 'mg' },
      frequency: med.frequency, timing: med.timing || [],
      duration: med.duration || { value: 7, unit: 'days' },
      startDate: med.startDate ? med.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      beforeFood: med.beforeFood || false, notes: med.notes || '',
      precautions: med.precautions || '', sideEffects: med.sideEffects || '',
      refillsRemaining: med.refillsRemaining || 0, isActive: med.isActive !== false, color: med.color || MEDICINE_COLORS[0]
    });
    setFormErrors({});
    setModal({ open: true, mode: 'edit', medicine: med });
  };

  const setF = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Medicine name required';
    if (!form.dosage.amount) e.dosageAmount = 'Dosage amount required';
    if (!form.frequency) e.frequency = 'Frequency required';
    if (modal.mode === 'add' && !form.patientId) e.patientId = 'Select a patient';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/medicines', form);
        toast.success('Medicine prescribed successfully!');
      } else {
        await api.put(`/medicines/${modal.medicine._id}`, form);
        toast.success('Medicine updated successfully!');
      }
      setModal({ open: false, mode: 'add', medicine: null });
      fetchMedicines(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medicine');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/medicines/${deleteConfirm._id}`);
      toast.success('Medicine deleted');
      setDeleteConfirm(null);
      fetchMedicines(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally { setDeleteLoading(false); }
  };

  const toggleTiming = (t) => {
    setForm(f => ({
      ...f, timing: f.timing.includes(t) ? f.timing.filter(x => x !== t) : [...f.timing, t]
    }));
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicines</h1>
          <p className="page-subtitle">{pagination.total} prescription{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} disabled={patients.length === 0}>
          ➕ Prescribe Medicine
        </button>
      </div>

      {patients.length === 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: 'var(--warning)' }}>
          ⚠️ You need to add patients before prescribing medicines.
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control search-input" placeholder="Search medicines..." value={search}
              onChange={e => { setSearch(e.target.value); fetchMedicines(1, e.target.value, filterPatient); }} />
          </div>
          <select className="form-control" style={{ width: 200 }} value={filterPatient}
            onChange={e => { setFilterPatient(e.target.value); fetchMedicines(1, search, e.target.value); }}>
            <option value="">All Patients</option>
            {patients.map(p => <option key={p._id} value={p._id}>{p.user?.firstName} {p.user?.lastName}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /></div>
      ) : medicines.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <h3>No medicines found</h3>
            <p>Start prescribing medicines to your patients</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Patient</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(med => (
                  <tr key={med._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.color || 'var(--primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{med.name}</div>
                          {med.genericName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{med.genericName}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{med.patient?.user?.firstName} {med.patient?.user?.lastName}</td>
                    <td><span className="badge badge-info">{getDosageLabel(med.dosage)}</span></td>
                    <td><span className="badge badge-primary">{getFrequencyLabel(med.frequency)}</span></td>
                    <td style={{ fontSize: 13 }}>{med.duration?.value} {med.duration?.unit}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(med.startDate)}</td>
                    <td><span className={`badge ${med.isActive ? 'badge-success' : 'badge-secondary'}`}>{med.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(med)}>✏️ Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(med)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={fetchMedicines} />
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'add', medicine: null })}
        title={modal.mode === 'add' ? '💊 Prescribe Medicine' : '✏️ Edit Prescription'}
        size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', medicine: null })}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="loading-spinner" /> Saving...</> : modal.mode === 'add' ? 'Prescribe' : 'Update'}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {modal.mode === 'add' && (
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <select className={`form-control ${formErrors.patientId ? 'error' : ''}`} value={form.patientId} onChange={e => setF('patientId', e.target.value)}>
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p._id} value={p._id}>{p.user?.firstName} {p.user?.lastName}</option>)}
              </select>
              {formErrors.patientId && <span className="form-error">{formErrors.patientId}</span>}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Medicine Name *</label>
              <input className={`form-control ${formErrors.name ? 'error' : ''}`} placeholder="e.g., Metformin" value={form.name} onChange={e => setF('name', e.target.value)} />
              {formErrors.name && <span className="form-error">{formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input className="form-control" placeholder="e.g., Metformin HCl" value={form.genericName} onChange={e => setF('genericName', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dosage Amount *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className={`form-control ${formErrors.dosageAmount ? 'error' : ''}`} placeholder="500" value={form.dosage.amount}
                  onChange={e => setF('dosage', { ...form.dosage, amount: e.target.value })} style={{ flex: 1 }} />
                <select className="form-control" value={form.dosage.unit} onChange={e => setF('dosage', { ...form.dosage, unit: e.target.value })} style={{ width: 100 }}>
                  {DOSAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {formErrors.dosageAmount && <span className="form-error">{formErrors.dosageAmount}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Frequency *</label>
              <select className={`form-control ${formErrors.frequency ? 'error' : ''}`} value={form.frequency} onChange={e => setF('frequency', e.target.value)}>
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Timing (when to take)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIMINGS.map(t => (
                <button key={t} type="button"
                  className={`btn btn-sm ${form.timing.includes(t) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleTiming(t)}>
                  {capitalize(t)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" className="form-control" value={form.duration.value} min={1}
                  onChange={e => setF('duration', { ...form.duration, value: parseInt(e.target.value) })} style={{ flex: 1 }} />
                <select className="form-control" value={form.duration.unit} onChange={e => setF('duration', { ...form.duration, unit: e.target.value })} style={{ width: 110 }}>
                  {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <label className="toggle">
                <input type="checkbox" checked={form.beforeFood} onChange={e => setF('beforeFood', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
              <span className="form-label" style={{ margin: 0 }}>Take Before Food</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Instructions</label>
            <textarea className="form-control" placeholder="e.g., Take with a full glass of water..." rows={3}
              value={form.notes} onChange={e => setF('notes', e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Precautions</label>
              <textarea className="form-control" placeholder="e.g., Avoid alcohol..." rows={2}
                value={form.precautions} onChange={e => setF('precautions', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Side Effects</label>
              <textarea className="form-control" placeholder="e.g., May cause drowsiness..." rows={2}
                value={form.sideEffects} onChange={e => setF('sideEffects', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Refills Remaining</label>
              <input type="number" className="form-control" value={form.refillsRemaining} min={0}
                onChange={e => setF('refillsRemaining', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Medicine Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {MEDICINE_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setF('color', c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
          </div>

          {modal.mode === 'edit' && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <label className="toggle">
                  <input type="checkbox" checked={form.isActive} onChange={e => setF('isActive', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
                <span className="form-label" style={{ margin: 0 }}>Active Prescription</span>
              </label>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Delete "${deleteConfirm?.name}" prescription? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
      />
    </div>
  );
};

export default DoctorMedicines;
