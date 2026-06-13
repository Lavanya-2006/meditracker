import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '', role: 'patient', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field, value) => { setForm(f => ({ ...f, [field]: value })); setErrors(e => ({ ...e, [field]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.username.trim() || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const user = await register(data);
      toast.success(`Welcome to MediTracker, ${user.firstName}!`);
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-header">
          <div className="auth-logo">🏥</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join MediTracker today</p>
        </div>

        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
            {errors.general}
          </div>
        )}

        {/* Role Selector */}
        <div className="form-group">
          <label className="form-label">I am a</label>
          <div className="role-selector">
            {[{ value: 'patient', icon: '🤒', label: 'Patient' }, { value: 'doctor', icon: '👨‍⚕️', label: 'Doctor' }].map(r => (
              <div key={r.value} className={`role-option ${form.role === r.value ? 'selected' : ''}`} onClick={() => set('role', r.value)}>
                <div className="role-option-icon">{r.icon}</div>
                <div className="role-option-label">{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className={`form-control ${errors.firstName ? 'error' : ''}`} placeholder="John" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className={`form-control ${errors.lastName ? 'error' : ''}`} placeholder="Doe" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className={`form-control ${errors.username ? 'error' : ''}`} placeholder="johndoe" value={form.username} onChange={e => set('username', e.target.value)} autoComplete="username" />
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input className="form-control" placeholder="+1 234 567 8900" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className={`form-control ${errors.email ? 'error' : ''}`} placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className={`form-control ${errors.password ? 'error' : ''}`} placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className={`form-control ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} autoComplete="new-password" />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="loading-spinner" /> Creating account...</> : '✨ Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
