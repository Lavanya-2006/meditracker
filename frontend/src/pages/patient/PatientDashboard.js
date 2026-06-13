import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getFrequencyLabel, getDosageLabel, getAdherenceColor, formatDate } from '../../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, schedRes] = await Promise.all([
        api.get('/patients/dashboard'),
        api.get('/medication-status/today')
      ]);
      setDashboard(dashRes.data.dashboard);
      setSchedule(schedRes.data.schedule);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markStatus = async (medicineId, status) => {
    setUpdatingStatus(medicineId);
    try {
      await api.post('/medication-status', {
        medicineId,
        date: new Date().toISOString().split('T')[0],
        status
      });
      toast.success(`Medicine marked as ${status}!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    } finally { setUpdatingStatus(null); }
  };

  const adherenceRate = dashboard?.adherenceRate || 0;
  const adherenceColor = getAdherenceColor(adherenceRate);

  const pieData = dashboard?.todayStats
    ? [
      { name: 'Taken', value: dashboard.todayStats.taken, color: '#10b981' },
      { name: 'Missed', value: dashboard.todayStats.missed, color: '#ef4444' },
      { name: 'Pending', value: Math.max(0, (dashboard.todayStats.total || 0) - dashboard.todayStats.taken - dashboard.todayStats.missed), color: '#f59e0b' }
    ].filter(d => d.value > 0)
    : [];

  if (loading) return <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /><span>Loading your dashboard...</span></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.firstName}! 👋</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        {[
          { label: 'Total Medicines', value: dashboard?.totalMedicines || 0, icon: '💊', color: '#4F6EF7', bg: 'rgba(79,110,247,0.1)' },
          { label: 'Taken Today', value: dashboard?.todayStats?.taken || 0, icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Missed Today', value: dashboard?.todayStats?.missed || 0, icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Adherence Rate', value: `${adherenceRate}%`, icon: '📈', color: adherenceColor, bg: `${adherenceColor}18` }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg }}><span>{s.icon}</span></div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-6">
        {/* Today's Schedule */}
        <div className="card" style={{ gridColumn: pieData.length > 0 ? '1' : '1 / -1' }}>
          <div className="card-header">
            <h3 className="card-title">Today's Medicines</h3>
            <span className="badge badge-info">{schedule.length} total</span>
          </div>
          {schedule.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">💊</div>
              <h3>No medicines today</h3>
              <p>You have no prescribed medicines. Contact your doctor if needed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {schedule.map(({ medicine, status, takenAt, statusId }) => (
                <div key={medicine._id} className="medicine-card" style={{ '--med-color': medicine.color || '#4F6EF7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div className="medicine-name">{medicine.name}</div>
                      {medicine.genericName && <div className="medicine-generic">{medicine.genericName}</div>}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {getDosageLabel(medicine.dosage)} • {getFrequencyLabel(medicine.frequency)}
                        {medicine.beforeFood ? ' • Before food' : ' • After food'}
                      </div>
                    </div>
                    <span className={`badge ${status === 'taken' ? 'badge-success' : status === 'missed' ? 'badge-danger' : 'badge-warning'}`}>
                      {status === 'taken' ? '✅' : status === 'missed' ? '❌' : '⏳'} {status}
                    </span>
                  </div>
                  {takenAt && <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8 }}>Taken at {new Date(takenAt).toLocaleTimeString()}</div>}
                  {medicine.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>📝 {medicine.notes}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['taken', 'missed', 'pending'].map(s => (
                      <button
                        key={s}
                        className={`status-btn status-${s} ${status === s ? 'active' : ''}`}
                        onClick={() => markStatus(medicine._id, s)}
                        disabled={updatingStatus === medicine._id}
                      >
                        {updatingStatus === medicine._id ? '...' : s === 'taken' ? '✅ Taken' : s === 'missed' ? '❌ Missed' : '⏳ Pending'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adherence Pie */}
        {pieData.length > 0 && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Today's Progress</h3></div>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: adherenceColor }}>{adherenceRate}%</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>7-day adherence</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Doctor Info */}
      {dashboard && (
        <DoctorInfo />
      )}
    </div>
  );
};

const DoctorInfo = () => {
  const [patient, setPatient] = useState(null);
  useEffect(() => {
    api.get('/patients/profile').then(res => setPatient(res.data.patient)).catch(() => {});
  }, []);

  if (!patient?.doctor) return (
    <div className="card" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--warning)' }}>No Doctor Assigned</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You are not assigned to a doctor yet. Please contact a doctor and ask them to add you.</div>
        </div>
      </div>
    </div>
  );

  const doc = patient.doctor;
  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title">My Doctor</h3></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="avatar" style={{ background: 'var(--gradient-primary)' }}>
          {doc.user?.profileImage ? <img src={doc.user.profileImage} alt="" /> : `${(doc.user?.firstName||'')[0]}${(doc.user?.lastName||'')[0]}`}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Dr. {doc.user?.firstName} {doc.user?.lastName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doc.specialization || 'General Practitioner'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doc.user?.email}</div>
          {doc.hospital && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>🏥 {doc.hospital}</div>}
        </div>
        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Active</span>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

export default PatientDashboard;
