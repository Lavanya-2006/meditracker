import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getInitials, getFrequencyLabel, getDosageLabel, timeAgo, formatDate } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/doctors/dashboard');
        setDashboard(res.data.dashboard);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="page-loader">
      <div className="loading-spinner dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <span>Loading dashboard...</span>
    </div>
  );

  const chartData = dashboard?.medicinesByPatient?.slice(0, 6).map((m, i) => ({
    name: `Patient ${i + 1}`,
    medicines: m.count
  })) || [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, Dr. {user?.lastName}! 👋</h1>
          <p className="page-subtitle">Here's your practice overview for today</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/doctor/patients')}>
          ➕ Add Patient
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        {[
          { label: 'Total Patients', value: dashboard?.totalPatients || 0, icon: '👥', color: '#4F6EF7', bg: 'rgba(79,110,247,0.1)' },
          { label: 'Active Medicines', value: dashboard?.totalMedicines || 0, icon: '💊', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Patients w/ Meds', value: dashboard?.activePatientsWithMeds || 0, icon: '📋', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Years Experience', value: 0, icon: '🏥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <span>{s.icon}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-6">
        {/* Recent Patients */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Patients</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/doctor/patients')}>View All →</button>
          </div>
          {dashboard?.recentPatients?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dashboard.recentPatients.map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar sm" style={{ background: 'var(--gradient-primary)' }}>
                    {p.user?.profileImage
                      ? <img src={p.user.profileImage} alt="" />
                      : getInitials(p.user?.firstName, p.user?.lastName)
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.user?.firstName} {p.user?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.user?.email}</div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: 10 }}>Active</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">👥</div>
              <p>No patients yet. Add your first patient!</p>
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Prescriptions</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/doctor/medicines')}>View All →</button>
          </div>
          {dashboard?.recentMedicines?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dashboard.recentMedicines.map(m => (
                <div key={m._id} className="medicine-card" style={{ '--med-color': m.color || '#4F6EF7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="medicine-name">{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        For: {m.patient?.user?.firstName} {m.patient?.user?.lastName}
                      </div>
                    </div>
                    <span className="badge badge-secondary">{getDosageLabel(m.dosage)}</span>
                  </div>
                  <div className="medicine-meta">
                    <span className="badge badge-primary">{getFrequencyLabel(m.frequency)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">💊</div>
              <p>No prescriptions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Medicines per Patient</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
              />
              <Bar dataKey="medicines" fill="url(#colorGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a2980" />
                  <stop offset="100%" stopColor="#26d0ce" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

export default DoctorDashboard;
