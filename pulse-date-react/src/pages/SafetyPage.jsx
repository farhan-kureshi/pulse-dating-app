import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './SafetyPage.css';

const SafetyPage = () => {
    const location = useLocation();
// ... baaki code

    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Framer Motion Animation Variants
    const fadeUp = {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    // 3D Hover Effect for Cards
    const hover3D = {
        rest: { scale: 1, rotateX: 0, rotateY: 0, boxShadow: "0px 10px 30px rgba(0,0,0,0.05)" },
        hover: { 
            scale: 1.03, 
            rotateX: 5, 
            rotateY: -5, 
            boxShadow: "10px 20px 40px rgba(29, 78, 216, 0.15)",
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    return (
        <div className="safety-wrapper">
            {/* 1. SECURE NAVBAR */}
           {/* 1. UNIFIED NAVBAR (Matches Home Page) */}
            <nav className="unified-navbar">
                <div className="container-fluid d-flex align-items-center px-4 py-4 position-relative">
                    
                    {/* Left Side: Navigation Links */}
                    <div className="d-none d-md-flex align-items-center gap-4 fw-bold" style={{ flex: 1 }}>
                        <Link to="/" className={`nav-link-custom ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                        <Link to="/mission" className={`nav-link-custom ${location.pathname === '/mission' ? 'active' : ''}`}>Mission</Link>
                        <Link to="/safety" className={`nav-link-custom ${location.pathname === '/safety' ? 'active' : ''}`}>Safety</Link>
                        <Link to="/community" className={`nav-link-custom ${location.pathname === '/community' ? 'active' : ''}`}>Community</Link>
                    </div>

                    {/* Center: PulseDate Logo */}
                    <div className="position-absolute start-50 translate-middle-x">
                        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
                            <img src="/pulseicon.jpeg" alt="PulseDate" style={{ height: '30px', borderRadius: '5px' }} />
                            <span className="fw-bold fs-3" style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-heading)' }}>PulseDate</span>
                        </Link>
                    </div>

                    {/* Right Side: Log in & Join Button */}
                    <div className="d-flex align-items-center justify-content-end gap-4" style={{ flex: 1 }}>
                        <Link to="/auth" state={{ form: 'login' }} className="text-decoration-none fw-bold" style={{ color: 'var(--primary-color)' }}>Log in</Link>
                        <Link to="/auth" state={{ form: 'signup' }} className="btn-dark-solid text-decoration-none text-center" style={{ width: '130px', padding: '10px 0' }}>Join now</Link>
                    </div>
                    
                </div>
            </nav>
            {/* 2. HERO SECTION */}
            <header className="safety-hero">
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    variants={fadeUp} 
                    className="container text-center"
                >
                    <div className="badge-shield mb-4"><i className="fa-solid fa-lock me-2"></i> Uncompromised Security</div>
                    <h1 className="safety-title">Your safety is our <br/><span className="text-blue-gradient">first priority.</span></h1>
                    <p className="safety-subtitle mx-auto mt-4">
                        We use military-grade security, AI moderation, and real-time verification to ensure that your experience on PulseDate is safe, secure, and genuine.
                    </p>
                </motion.div>
            </header>

            {/* 3. INTERACTIVE 3D FEATURE CARDS */}
            <section className="safety-features">
                <div className="container">
                    <motion.div 
                        className="row g-5 justify-content-center"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={staggerContainer}
                    >
                        {/* Feature 1: Verification */}
                        <motion.div className="col-lg-5 col-md-6" variants={fadeUp}>
                            <motion.div 
                                className="safety-card-3d"
                                initial="rest"
                                whileHover="hover"
                                animate="rest"
                                variants={hover3D}
                            >
                                <div className="safety-icon-wrapper blue-glow">
                                    <i className="fa-solid fa-user-check"></i>
                                </div>
                                <h3>Verified Profiles Only</h3>
                                <p>We cross-check photos and details to ensure the person you are talking to is exactly who they say they are. Look for the blue checkmark.</p>
                            </motion.div>
                        </motion.div>

                        {/* Feature 2: Privacy */}
                        <motion.div className="col-lg-5 col-md-6" variants={fadeUp}>
                            <motion.div 
                                className="safety-card-3d"
                                initial="rest"
                                whileHover="hover"
                                animate="rest"
                                variants={hover3D}
                            >
                                <div className="safety-icon-wrapper purple-glow">
                                    <i className="fa-solid fa-eye-slash"></i>
                                </div>
                                <h3>Absolute Privacy</h3>
                                <p>Your exact location is never shared. Your phone number is hidden. We use advanced encryption so your chats and photos remain strictly between your matches.</p>
                            </motion.div>
                        </motion.div>

                        {/* Feature 3: Moderation */}
                        <motion.div className="col-lg-5 col-md-6" variants={fadeUp}>
                            <motion.div 
                                className="safety-card-3d"
                                initial="rest"
                                whileHover="hover"
                                animate="rest"
                                variants={hover3D}
                            >
                                <div className="safety-icon-wrapper green-glow">
                                    <i className="fa-solid fa-robot"></i>
                                </div>
                                <h3>AI Scam Detection</h3>
                                <p>Our backend systems continuously scan for suspicious patterns, fake links, and scam behavior, neutralizing threats before they reach your inbox.</p>
                            </motion.div>
                        </motion.div>

                        {/* Feature 4: Control */}
                        <motion.div className="col-lg-5 col-md-6" variants={fadeUp}>
                            <motion.div 
                                className="safety-card-3d"
                                initial="rest"
                                whileHover="hover"
                                animate="rest"
                                variants={hover3D}
                            >
                                <div className="safety-icon-wrapper red-glow">
                                    <i className="fa-solid fa-ban"></i>
                                </div>
                                <h3>You are in Control</h3>
                                <p>Unmatch or block anyone with a single tap. Our zero-tolerance policy means reported users are permanently banned from the PulseDate ecosystem.</p>
                            </motion.div>
                        </motion.div>

                    </motion.div>
                </div>
            </section>

            {/* 4. EMERGENCY CONTACT CTA */}
            <section className="safety-cta text-center">
                <motion.div 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true }} 
                    variants={fadeUp}
                    className="container"
                >
                    <div className="cta-box">
                        <i className="fa-solid fa-triangle-exclamation text-warning fs-1 mb-3"></i>
                        <h2 className="fw-bold mb-3" style={{ color: 'white' }}>Need immediate help?</h2>
                        <p className="text-white-50 mb-4 mx-auto" style={{ maxWidth: '500px' }}>
                            If you ever feel unsafe or experience harassment during a real-life date, please contact local authorities immediately.
                        </p>
                        <button className="btn-emergency">
                            View Safety Guidelines
                        </button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default SafetyPage;