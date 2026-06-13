import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getAdherenceColor, formatDate } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const PatientAdherence = () => {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [adherenceRes, historyRes] = await Promise.all([
          api.get('/patients/adherence', { params: { days } }),
          api.get('/medication-status', {
            params: {
              startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date().toISOString()
            }
          })
        ]);
        setReport(adherenceRes.data.report);
        setHistory(historyRes.data.statuses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  const adherenceRate = report?.overall?.adherenceRate || 0;
  const adherenceColor = getAdherenceColor(adherenceRate);

  // Prepare daily chart data
  const dailyChartData = report?.byDate
    ? Object.entries(report.byDate)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-14)
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          taken: stats.taken,
          missed: stats.missed,
          adherence: stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0
        }))
    : [];

  if (loading) return <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Adherence Report</h1>
          <p className="page-subtitle">Track your medication compliance history</p>
        </div>
        <select className="form-control" style={{ width: 140 }} value={days} onChange={e => setDays(parseInt(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Overall Stats */}
      <div className="stats-grid mb-6">
        {[
          { label: 'Overall Adherence', value: `${adherenceRate}%`, icon: '📊', color: adherenceColor, bg: `${adherenceColor}18` },
          { label: 'Doses Taken', value: report?.overall?.taken || 0, icon: '✅', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Doses Missed', value: report?.overall?.missed || 0, icon: '❌', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Total Doses', value: report?.overall?.total || 0, icon: '💊', color: 'var(--primary)', bg: 'rgba(26,41,128,0.1)' }
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

      {/* Adherence Indicator */}
      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="card-title">Overall Adherence Score</h3>
          <span style={{ fontSize: 24, fontWeight: 800, color: adherenceColor }}>{adherenceRate}%</span>
        </div>
        <div className="progress-bar" style={{ height: 14, marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${adherenceRate}%`, background: adherenceColor }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>0%</span>
          <span style={{ color: adherenceColor, fontWeight: 700 }}>
            {adherenceRate >= 80 ? '🌟 Excellent!' : adherenceRate >= 60 ? '👍 Good' : '⚠️ Needs improvement'}
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyChartData.length > 0 && (
        <div className="grid-2 mb-6">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Daily Adherence Trend</h3></div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  formatter={v => [`${v}%`, 'Adherence']}
                />
                <Line type="monotone" dataKey="adherence" stroke={adherenceColor} strokeWidth={2.5} dot={{ r: 4, fill: adherenceColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Taken vs Missed</h3></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="taken" fill="#10b981" radius={[4, 4, 0, 0]} name="Taken" />
                <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Missed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per Medicine */}
      {report?.byMedicine?.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><h3 className="card-title">Per Medicine Adherence</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {report.byMedicine.map(med => {
              const rate = med.total > 0 ? Math.round((med.taken / med.total) * 100) : 0;
              const color = getAdherenceColor(rate);
              return (
                <div key={med.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.color || 'var(--primary)' }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--success)' }}>✅ {med.taken}</span>
                      <span style={{ color: 'var(--danger)' }}>❌ {med.missed}</span>
                      <span style={{ color, fontWeight: 700 }}>{rate}%</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${rate}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Dose History</h3>
          <span className="badge badge-secondary">{history.length} records</span>
        </div>
        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-state-icon">📋</div>
            <h3>No history yet</h3>
            <p>Start tracking your medicines from the dashboard</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Medicine</th>
                  <th>Status</th>
                  <th>Taken At</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 50).map(s => (
                  <tr key={s._id}>
                    <td style={{ fontSize: 13 }}>{formatDate(s.date)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.medicine?.color || 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{s.medicine?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'taken' ? 'badge-success' : s.status === 'missed' ? 'badge-danger' : 'badge-warning'}`}>
                        {s.status === 'taken' ? '✅' : s.status === 'missed' ? '❌' : '⏳'} {s.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {s.takenAt ? new Date(s.takenAt).toLocaleTimeString() : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAdherence;
