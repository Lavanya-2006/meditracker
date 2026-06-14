import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { reminderService, requestNotificationPermission, showBrowserNotification, playAlarmSound } from '../../services/reminderService';
import { friendlyDate } from '../../utils/helpers';

const defaultForm = {
  medicineId: '', title: '', scheduledTime: '', repeatType: 'none',
  repeatDays: [], soundEnabled: true, snoozeMinutes: 10, notes: ''
};

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const PatientReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [modal, setModal] = useState({ open: false, mode: 'add', reminder: null });
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notifPermission, setNotifPermission] = useState(Notification?.permission || 'default');
  const [activePopup, setActivePopup] = useState(null);
  const checkIntervalRef = useRef(null);

  const fetchReminders = useCallback(async (page = 1) => {
    try {
      const [allRes, upcomingRes] = await Promise.all([
        reminderService.getAll({ page, limit: 10 }),
        reminderService.getAll({ upcoming: true, limit: 5 })
      ]);
      setReminders(allRes.data.reminders);
      setPagination(allRes.data.pagination);
      setUpcomingReminders(upcomingRes.data.reminders);
    } catch { toast.error('Failed to load reminders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchReminders();
    api.get('/patients/medicines', { params: { isActive: true, limit: 100 } })
      .then(res => setMedicines(res.data.medicines))
      .catch(() => {});
  }, [fetchReminders]);

  // Poll for due reminders every 30 seconds
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const now = new Date();
      upcomingReminders.forEach(r => {
        const scheduledTime = new Date(r.scheduledTime);
        const diff = Math.abs(now - scheduledTime) / 1000;
        if (diff < 31 && r.status === 'pending') {
          triggerReminder(r);
        }
      });
    }, 30000);
    return () => clearInterval(checkIntervalRef.current);
  }, [upcomingReminders]);

  const triggerReminder = (reminder) => {
    if (reminder.soundEnabled) playAlarmSound();
    showBrowserNotification(
      `💊 Medicine Reminder`,
      `Time to take: ${reminder.medicine?.name || reminder.title}`,
      { tag: reminder._id }
    );
    setActivePopup(reminder);
  };

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) toast.success('Notifications enabled!');
    else toast.error('Notification permission denied');
  };

  const openAdd = () => {
    const defaultTime = new Date();
    defaultTime.setMinutes(defaultTime.getMinutes() + 30);
    setForm({
      ...defaultForm,
      scheduledTime: defaultTime.toISOString().slice(0, 16)
    });
    setModal({ open: true, mode: 'add', reminder: null });
  };

  const openEdit = (r) => {
    setForm({
      medicineId: r.medicine?._id || '',
      title: r.title,
      scheduledTime: new Date(r.scheduledTime).toISOString().slice(0, 16),
      repeatType: r.repeatType || 'none',
      repeatDays: r.repeatDays || [],
      soundEnabled: r.soundEnabled !== false,
      snoozeMinutes: r.snoozeMinutes || 10,
      notes: r.notes || ''
    });
    setModal({ open: true, mode: 'edit', reminder: r });
  };

  const handleSave = async () => {
    if (!form.medicineId || !form.title || !form.scheduledTime) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await reminderService.create({ ...form, medicineId: form.medicineId });
        toast.success('Reminder created!');
      } else {
        await reminderService.update(modal.reminder._id, { ...form, medicineId: form.medicineId });
        toast.success('Reminder updated!');
      }
      setModal({ open: false, mode: 'add', reminder: null });
      fetchReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reminder');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await reminderService.delete(deleteConfirm._id);
      toast.success('Reminder deleted');
      setDeleteConfirm(null);
      fetchReminders();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const handlePopupAction = async (reminder, action) => {
    try {
      await reminderService.updateStatus(reminder._id, action);
      setActivePopup(null);
      fetchReminders();
    } catch {}
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      repeatDays: f.repeatDays.includes(day)
        ? f.repeatDays.filter(d => d !== day)
        : [...f.repeatDays, day]
    }));
  };

  const getStatusColor = (status) => {
    const map = { pending: 'var(--warning)', completed: 'var(--success)', missed: 'var(--danger)', snoozed: 'var(--info)' };
    return map[status] || 'var(--text-muted)';
  };

  return (
    <div className="animate-fade">
      {/* Reminder Popup */}
      {activePopup && (
        <div className="reminder-popup">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>⏰ Medicine Reminder!</div>
            <button className="btn btn-ghost btn-icon" onClick={() => setActivePopup(null)} style={{ fontSize: 16, padding: 4 }}>✕</button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Time to take: <strong>{activePopup.medicine?.name || activePopup.title}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            {activePopup.medicine?.dosage?.amount} {activePopup.medicine?.dosage?.unit}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handlePopupAction(activePopup, 'completed')}>✅ Taken</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handlePopupAction(activePopup, 'snoozed')}>⏱️ Snooze</button>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">Manage your medicine reminders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {notifPermission !== 'granted' && (
            <button className="btn btn-secondary" onClick={requestPermission}>🔔 Enable Notifications</button>
          )}
          <button className="btn btn-primary" onClick={openAdd} disabled={medicines.length === 0}>➕ Add Reminder</button>
        </div>
      </div>

      {notifPermission === 'granted' && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
          ✅ Browser notifications are enabled. You'll receive alerts for upcoming medicines.
        </div>
      )}

      {medicines.length === 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: 'var(--warning)' }}>
          ⚠️ No active medicines. Your doctor needs to prescribe medicines before you can set reminders.
        </div>
      )}

      <div className="grid-2 mb-6">
        {/* Upcoming */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Reminders</h3>
            <span className="badge badge-warning">{upcomingReminders.length}</span>
          </div>
          {upcomingReminders.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon" style={{ fontSize: 32 }}>🔔</div>
              <p style={{ margin: 0 }}>No upcoming reminders</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingReminders.map(r => {
                const t = new Date(r.scheduledTime);
                return (
                  <div key={r._id} className="reminder-card">
                    <div className="reminder-time-badge">
                      <div className="time">{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                      <div className="period">{t.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.medicine?.name} • {r.medicine?.dosage?.amount} {r.medicine?.dosage?.unit}</div>
                      {r.soundEnabled && <div style={{ fontSize: 11, color: 'var(--info)' }}>🔊 Sound enabled</div>}
                    </div>
                    <span className="badge badge-warning">{friendlyDate(r.scheduledTime)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Reminder Stats</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total Reminders', value: pagination.total, color: 'var(--primary)', icon: '🔔' },
              { label: 'Upcoming', value: upcomingReminders.length, color: 'var(--warning)', icon: '⏰' },
              { label: 'Notification Status', value: notifPermission === 'granted' ? 'Enabled' : 'Disabled', color: notifPermission === 'granted' ? 'var(--success)' : 'var(--danger)', icon: notifPermission === 'granted' ? '✅' : '❌' }
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{s.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</span>
                </div>
                <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Reminders */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">All Reminders</h3></div>
        {loading ? (
          <div className="page-loader" style={{ minHeight: 150 }}><div className="loading-spinner dark" style={{ width: 28, height: 28 }} /></div>
        ) : reminders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No reminders yet</h3>
            <p>Create reminders to never miss your medicines</p>
            {medicines.length > 0 && <button className="btn btn-primary" onClick={openAdd}>Create First Reminder</button>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reminders.map(r => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg)', borderRadius: 12 }}>
                  <div style={{ fontSize: 20 }}>{r.soundEnabled ? '🔊' : '🔕'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.medicine?.name} • {friendlyDate(r.scheduledTime)}
                      {r.repeatType !== 'none' && ` • Repeats ${r.repeatType}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(r.status), textTransform: 'capitalize' }}>{r.status}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(r)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={fetchReminders} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', reminder: null })}
        title={modal.mode === 'add' ? '🔔 New Reminder' : '✏️ Edit Reminder'} size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', reminder: null })}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="loading-spinner" /> Saving...</> : modal.mode === 'add' ? 'Create Reminder' : 'Update Reminder'}
          </button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Medicine *</label>
          <select className="form-control" value={form.medicineId} onChange={e => {
            const med = medicines.find(m => m._id === e.target.value);
            setForm(f => ({ ...f, medicineId: e.target.value, title: med ? `Take ${med.name}` : f.title }));
          }}>
            <option value="">Select medicine...</option>
            {medicines.map(m => <option key={m._id} value={m._id}>{m.name} ({m.dosage?.amount} {m.dosage?.unit})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Reminder Title *</label>
          <input className="form-control" placeholder="e.g., Take morning medicine" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Scheduled Time *</label>
          <input type="datetime-local" className="form-control" value={form.scheduledTime}
            onChange={e => setForm({ ...form, scheduledTime: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Repeat</label>
            <select className="form-control" value={form.repeatType} onChange={e => setForm({ ...form, repeatType: e.target.value })}>
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom days</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Snooze (minutes)</label>
            <input type="number" className="form-control" min={1} max={60} value={form.snoozeMinutes}
              onChange={e => setForm({ ...form, snoozeMinutes: parseInt(e.target.value) || 10 })} />
          </div>
        </div>
        {form.repeatType === 'custom' && (
          <div className="form-group">
            <label className="form-label">Days</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS.map(d => (
                <button key={d} type="button"
                  className={`btn btn-sm ${form.repeatDays.includes(d) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleDay(d)}>
                  {d.substring(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <label className="toggle">
              <input type="checkbox" checked={form.soundEnabled} onChange={e => setForm({ ...form, soundEnabled: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
            <span className="form-label" style={{ margin: 0 }}>Enable alarm sound</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={2} value={form.notes} placeholder="Optional notes..."
            onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Reminder" message={`Delete "${deleteConfirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete" danger loading={deleteLoading} />
    </div>
  );
};

export default PatientReminders;
