import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title || 'Confirm Action'}
    size="sm"
    footer={
      <>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <span className="loading-spinner" /> : confirmLabel}
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
  </Modal>
);

export default ConfirmDialog;
