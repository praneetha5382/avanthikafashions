'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
    // In a real app, this would call an API to send an SMS
  };

  const handleVerifyOtp = () => {
    if (otpCode === '1234') { // Mock OTP validation
      login(phone);
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert("Invalid OTP code. Please try again.");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        <h2 className={styles.title}>Login / Sign Up</h2>
        <p className={styles.subtitle}>Enter your mobile number to view your orders.</p>

        {!otpSent ? (
          <div className={styles.formGroup}>
            <input 
              type="tel" 
              placeholder="Mobile Number" 
              className={styles.input}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={10}
            />
            <button className={`btn-primary ${styles.actionBtn}`} onClick={handleSendOtp}>
              Send OTP
            </button>
            <p className={styles.mockNote}>Mock OTP is '1234'</p>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <p className={styles.sentTo}>OTP sent to +91 {phone}</p>
            <input 
              type="text" 
              placeholder="Enter 4-digit OTP" 
              className={styles.input}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              maxLength={4}
            />
            <button className={`btn-primary ${styles.actionBtn}`} onClick={handleVerifyOtp}>
              Verify OTP
            </button>
            <button className={styles.textBtn} onClick={() => setOtpSent(false)}>Change Number</button>
          </div>
        )}
      </div>
    </div>
  );
}
