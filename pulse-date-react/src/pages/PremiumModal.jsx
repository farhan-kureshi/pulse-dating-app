import React, { useState } from 'react';
import './PremiumModal.css';

const PremiumModal = ({ onClose, onPay }) => {
    const [selectedPlan, setSelectedPlan] = useState('6months');

    return (
        <div className="premium-overlay">
            <div className="premium-card">
                <i className="fa-solid fa-xmark close-premium" onClick={onClose}></i>

                <i className="fa-solid fa-crown vip-icon"></i>
                <h1 className="gold-text">PulseDate VIP</h1>
                <p className="text-white-50 mt-2">Stop guessing. See who likes you immediately.</p>

                {/* --- Premium Features List --- */}
                <div className="premium-features">
                    <p><i className="fa-solid fa-eye feature-check"></i> See everyone who liked you</p>
                    <p><i className="fa-solid fa-bolt feature-check"></i> 5 Free Super Likes a week</p>
                    <p><i className="fa-solid fa-infinity feature-check"></i> Unlimited Right Swipes</p>
                    <p><i className="fa-solid fa-plane feature-check"></i> Passport: Match anywhere in the world</p>
                </div>

                {/* --- Subscription Pricing Grid --- */}
                <div className="pricing-grid">
                    <div className={`price-box ${selectedPlan === '1month' ? 'active' : ''}`} onClick={() => setSelectedPlan('1month')}>
                        <div className="text-white-50 small fw-bold mb-1">1 Month</div>
                        <div className="fs-4 fw-bold text-white">₹499</div>
                        <div className="text-white-50" style={{ fontSize: '0.75rem' }}>/mo</div>
                    </div>

                    <div className={`price-box ${selectedPlan === '6months' ? 'active' : ''}`} onClick={() => setSelectedPlan('6months')}>
                        <div className="save-badge">Save 50%</div>
                        <div className="text-white-50 small fw-bold mb-1">6 Months</div>
                        <div className="fs-4 fw-bold" style={{ color: '#f5b748' }}>₹249</div>
                        <div className="text-white-50" style={{ fontSize: '0.75rem' }}>/mo</div>
                    </div>

                    <div className={`price-box ${selectedPlan === '12months' ? 'active' : ''}`} onClick={() => setSelectedPlan('12months')}>
                        <div className="save-badge">Save 70%</div>
                        <div className="text-white-50 small fw-bold mb-1">12 Months</div>
                        <div className="fs-4 fw-bold text-white">₹149</div>
                        <div className="text-white-50" style={{ fontSize: '0.75rem' }}>/mo</div>
                    </div>
                </div>

                {/* --- Trigger the payment workflow with the selected plan --- */}
                <button className="btn-gold" onClick={() => onPay(selectedPlan)}>
                    Upgrade Now
                </button>

                <div className="text-white-50 mt-4 text-decoration-underline" style={{ fontSize: '0.8rem', cursor: 'pointer' }} onClick={onClose}>
                    No thanks, I'll keep guessing
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;