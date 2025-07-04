// src/components/DomainBlockModal.tsx
import React from 'react';

interface DomainBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DomainBlockModal: React.FC<DomainBlockModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
      }}>
        <h2>Access Restricted</h2>
        <p>Tool available only for navgurukul.org domain.</p>
        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default DomainBlockModal;
