import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { getFrequencyLabel, getDosageLabel, formatDate, capitalize } from '../../utils/helpers';

const PatientMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [viewMed, setViewMed] = useState(null);



  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchMedicines = useCallback(async (page = 1, s = search, active = filterActive) => {
    setLoading(true);
    try {
      const params = { page, limit: 12, search: s };
      if (active !== '') params.isActive = active;
      const res = await api.get('/patients/medicines', { params });
      setMedicines(res.data.medicines);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load medicines'); }
    finally { setLoading(false); }
  }, [search, filterActive]);
  
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMedicines(); }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Medicines</h1>
          <p className="page-subtitle">{pagination.total} prescription{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control search-input" placeholder="Search medicines..." value={search}
              onChange={e => { setSearch(e.target.value); fetchMedicines(1, e.target.value, filterActive); }} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={filterActive}
            onChange={e => { setFilterActive(e.target.value); fetchMedicines(1, search, e.target.value); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><div className="loading-spinner dark" style={{ width: 32, height: 32 }} /></div>
      ) : medicines.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <h3>No medicines found</h3>
            <p>Your doctor hasn't prescribed any medicines yet, or none match your search.</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {medicines.map(med => (
              <div key={med._id} className="medicine-card" style={{ '--med-color': med.color || '#4F6EF7', cursor: 'pointer' }}
                onClick={() => setViewMed(med)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div className="medicine-name">{med.name}</div>
                    {med.genericName && <div className="medicine-generic">{med.genericName}</div>}
                  </div>
                  <span className={`badge ${med.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {med.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="medicine-meta">
                  <span className="badge badge-info">{getDosageLabel(med.dosage)}</span>
                  <span className="badge badge-primary">{getFrequencyLabel(med.frequency)}</span>
                  <span className="badge badge-secondary">{med.duration?.value} {med.duration?.unit}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  {med.beforeFood ? '🍽️ Before food' : '🍽️ After food'}
                  {med.timing?.length > 0 && ` • ${med.timing.map(capitalize).join(', ')}`}
                </div>
                {med.notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    📝 {med.notes.length > 80 ? med.notes.substring(0, 80) + '...' : med.notes}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                  <span>Start: {formatDate(med.startDate)}</span>
                  {med.endDate && <span>End: {formatDate(med.endDate)}</span>}
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={fetchMedicines} />
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!viewMed} onClose={() => setViewMed(null)} title="Medicine Details" size="md">
        {viewMed && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--bg)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: viewMed.color || 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💊</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{viewMed.name}</h3>
                {viewMed.genericName && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{viewMed.genericName}</p>}
              </div>
              <span className={`badge ${viewMed.isActive ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto' }}>
                {viewMed.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Dosage', value: getDosageLabel(viewMed.dosage) },
                { label: 'Frequency', value: getFrequencyLabel(viewMed.frequency) },
                { label: 'Duration', value: `${viewMed.duration?.value} ${viewMed.duration?.unit}` },
                { label: 'Take', value: viewMed.beforeFood ? 'Before food' : 'After food' },
                { label: 'Start Date', value: formatDate(viewMed.startDate) },
                { label: 'End Date', value: viewMed.endDate ? formatDate(viewMed.endDate) : 'Ongoing' },
                { label: 'Refills', value: viewMed.refillsRemaining || 0 },
                { label: 'Timing', value: viewMed.timing?.length > 0 ? viewMed.timing.map(capitalize).join(', ') : 'Not specified' }
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {viewMed.notes && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Instructions</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>{viewMed.notes}</div>
              </div>
            )}
            {viewMed.precautions && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: 6 }}>⚠️ Precautions</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(245,158,11,0.06)', padding: '10px 14px', borderRadius: 8 }}>{viewMed.precautions}</div>
              </div>
            )}
            {viewMed.sideEffects && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 6 }}>Side Effects</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(239,68,68,0.06)', padding: '10px 14px', borderRadius: 8 }}>{viewMed.sideEffects}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientMedicines;
