'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import NextImage from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartRequiresShipping, clearCart } = useCart();
  const { isLoggedIn, userPhone, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // OTP State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    if (isLoggedIn && userPhone) {
      setPhone(userPhone);
      setOtpVerified(true);
    }
  }, [isLoggedIn, userPhone]);

  // Form State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pin, setPin] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Success State
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleSendOtp = () => {
    if (phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
    alert("Mock OTP sent! Use code '1234' to verify.");
  };

  const handleVerifyOtp = () => {
    if (otpCode === '1234') {
      setOtpVerified(true);
      login(phone); // Save to profile
      alert("Phone number verified successfully!");
    } else {
      alert("Invalid OTP code. Please try again.");
    }
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setCouponApplied(true);
      alert("Coupon Applied!");
    } else {
      alert("Invalid Coupon Code");
    }
  };

  const handlePay = async () => {
    if (!email || !fullName || !address || !city || !state || !pin) {
      return alert("Please fill in all delivery details.");
    }
    setLoading(true);

    try {
      const payload = {
        customer_phone: phone,
        customer_email: email,
        customer_name: fullName,
        shipping_address: { address, city, state, pin },
        items: cartItems,
        subtotal: cartTotal,
        shipping_cost: shippingCost,
        discount: discountAmount,
        total: finalTotal,
        payment_method: paymentMethod
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setOrderId(data.orderId);
        setOrderSuccess(true);
        clearCart();
      } else {
        alert(data.error || "Failed to process order.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  // Pricing Logic
  const shippingCost = cartRequiresShipping ? 99 : 0;
  const discountAmount = couponApplied ? cartTotal * 0.1 : 0; // 10% discount
  const finalTotal = cartTotal - discountAmount + shippingCost;

  return (
    <div className={styles.checkoutPage}>
      <header className={styles.header}>
        <Link href="/">
          <NextImage src="/logo.png" alt="Avanthika Fashions" width={180} height={180} style={{ objectFit: 'contain' }} priority unoptimized />
        </Link>
      </header>

      {orderSuccess ? (
        <div className={styles.container} style={{justifyContent: 'center', minHeight: '60vh'}}>
          <div style={{textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', maxWidth: '600px', width: '100%'}}>
            <h2 style={{color: 'var(--primary-color)', fontSize: '2rem', marginBottom: '20px'}}>Order Confirmed!</h2>
            <p style={{fontSize: '1.1rem', color: '#555', marginBottom: '10px'}}>Thank you for shopping with Avanthika Fashions.</p>
            <p style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '30px'}}>Your Order ID is: <span style={{color: 'var(--primary-color)'}}>{orderId}</span></p>
            <p style={{marginBottom: '30px'}}>We have received your order and will begin processing it shortly. You will receive an SMS/Email with tracking details once it ships.</p>
            <Link href="/collections/all" className="btn-primary" style={{display: 'inline-block', textDecoration: 'none'}}>Continue Shopping</Link>
          </div>
        </div>
      ) : (
      <div className={styles.container}>
        {/* Left Form Section */}
        <div className={styles.formSection}>
          
          <div className={styles.sectionHeader}>
            <h2>Customer Details</h2>
          </div>
          
          <form className={styles.formGrid} onSubmit={e => e.preventDefault()}>
            
            {/* 1. Mobile & OTP Section (Always Active First) */}
            <div className={styles.otpBlock} style={{ gridColumn: '1 / -1', padding: '15px', border: '2px solid var(--primary-color)', borderRadius: '8px', background: '#fffafb', marginBottom: '15px' }}>
              <h3 style={{fontSize: '1.1rem', marginBottom: '10px', color: 'var(--primary-color)'}}>1. Mobile Verification</h3>
              <div className={styles.phoneInputRow}>
                <input 
                  className={`${styles.inputField} ${styles.phoneInput}`} 
                  type="tel" 
                  placeholder="Enter Mobile Number" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={otpVerified}
                />
                {!otpVerified && (
                  <button type="button" className={styles.otpActionBtn} onClick={handleSendOtp}>
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
                {otpVerified && <span className={styles.verifiedBadge}>✓ Verified</span>}
              </div>
              
              {otpSent && !otpVerified && (
                <div className={styles.otpVerifyRow} style={{ marginTop: '10px' }}>
                  <input 
                    className={`${styles.inputField} ${styles.otpInput}`} 
                    type="text" 
                    placeholder="Enter 4-digit OTP" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={4}
                  />
                  <button type="button" className={styles.otpActionBtn} onClick={handleVerifyOtp}>
                    Verify OTP
                  </button>
                </div>
              )}
            </div>

            {/* 2. Delivery Address (Disabled until OTP verified) */}
            <div style={{ gridColumn: '1 / -1', opacity: otpVerified ? 1 : 0.4, pointerEvents: otpVerified ? 'auto' : 'none' }}>
              <h3 style={{fontSize: '1.1rem', marginBottom: '10px', marginTop: '10px'}}>2. Delivery Details</h3>
              <div className={styles.formGrid}>
                <input className={`${styles.inputField} ${styles.fullWidth}`} type="email" placeholder="Email Address" required value={email} onChange={e=>setEmail(e.target.value)} />
                <input className={`${styles.inputField} ${styles.fullWidth}`} type="text" placeholder="Full Name" required value={fullName} onChange={e=>setFullName(e.target.value)} />
                <input className={`${styles.inputField} ${styles.fullWidth}`} type="text" placeholder="Complete Delivery Address" required value={address} onChange={e=>setAddress(e.target.value)} />
                <input className={styles.inputField} type="text" placeholder="City" required value={city} onChange={e=>setCity(e.target.value)} />
                <select className={styles.inputField} required value={state} onChange={e=>setState(e.target.value)}>
                  <option value="">State</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
                <input className={styles.inputField} type="text" placeholder="PIN code" required value={pin} onChange={e=>setPin(e.target.value)} />
              </div>
            </div>
            
          </form>

          <div className={styles.sectionHeader}>
            <h2>Payment Method</h2>
            <span className={styles.subhead}>All transactions are secure and encrypted.</span>
          </div>
          
          <div className={styles.paymentMethods}>
            <label className={`${styles.paymentOption} ${paymentMethod === 'razorpay' ? styles.selected : ''}`}>
              <div>
                <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                <span className={styles.payText}>Razorpay Secure (UPI, Cards)</span>
              </div>
            </label>
            {paymentMethod === 'razorpay' && (
              <div className={styles.paymentDetails}>
                <p>You will be redirected to Razorpay Secure to complete your purchase.</p>
              </div>
            )}
          </div>

          <button 
            className={`btn-primary ${styles.payBtn} ${!otpVerified ? styles.disabledBtn : ''}`} 
            onClick={handlePay} 
            disabled={loading || !otpVerified}
          >
            {!otpVerified ? 'Verify Mobile to Pay' : (loading ? 'Processing...' : 'Complete Order')}
          </button>

          <div className={styles.footerLinks}>
            <Link href="/policies/refund-policy">Refund policy</Link>
            <Link href="/policies/privacy-policy">Privacy policy</Link>
            <Link href="/policies/terms-of-service">Terms of service</Link>
          </div>
        </div>

        {/* Right Summary Section */}
        <div className={styles.summarySection}>
          <div className={styles.items}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.imageBadgeWrapper}>
                  <div className={styles.imageWrapper}>
                    <NextImage src={item.image} alt={item.name} fill className={styles.image} />
                  </div>
                  <span className={styles.badge}>{item.quantity}</span>
                </div>
                <div className={styles.details}>
                  <p className={styles.name}>{item.name}</p>
                </div>
                <p className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            ))}
            {cartItems.length === 0 && <p>Your cart is empty.</p>}
          </div>

          <div className={styles.couponSection}>
            <input 
              type="text" 
              placeholder="Gift card or discount code" 
              className={styles.couponInput} 
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              disabled={couponApplied}
            />
            <button className={styles.applyBtn} onClick={applyCoupon} disabled={!couponCode || couponApplied}>
              {couponApplied ? 'Applied' : 'Apply'}
            </button>
          </div>

          <div className={styles.totals}>
            <div className={styles.row}>
              <span className={styles.label}>Subtotal</span>
              <span className={styles.value}>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            {couponApplied && (
              <div className={styles.row}>
                <span className={styles.label}>Discount (WELCOME10)</span>
                <span className={styles.discountValue}>-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Shipping</span>
              {shippingCost === 0 ? (
                <span className={styles.shippingValue}>Free Standard Shipping</span>
              ) : (
                <span className={styles.value}>₹{shippingCost.toLocaleString('en-IN')}</span>
              )}
            </div>
            <div className={`${styles.row} ${styles.grandTotal}`}>
              <span className={styles.label}>Total</span>
              <span className={styles.value}>
                <span className={styles.currency}>INR</span> ₹{finalTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
