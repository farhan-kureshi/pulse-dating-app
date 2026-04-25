import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './MissionPage.css';

const MissionPage = () => {
    const location = useLocation();
// ... baaki code
    // Page load hote hi screen top par aa jaye
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Animation configuration
    const fadeUp = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    return (
        <div className="mission-wrapper">
            {/* 1. PREMIUM NAVBAR */}
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
            <header className="mission-hero">
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    variants={fadeUp} 
                    className="container text-center"
                >
                    <div className="badge-premium mb-4">Our Core Mission</div>
                    <h1 className="mission-title">We want you to <br/><span className="text-gradient">delete our app.</span></h1>
                    <p className="mission-subtitle mx-auto mt-4">
                        PulseDate wasn't built for endless swiping. We built it to get you off your phone and onto a great date in the real world. Authentic profiles, real intentions, and genuine connections.
                    </p>
                </motion.div>
            </header>

            {/* 3. CORE PILLARS SECTION */}
            <section className="mission-pillars">
                <div className="container">
                    <motion.div 
                        className="row g-5"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={staggerContainer}
                    >
                        {/* Pillar 1 */}
                        <motion.div className="col-lg-4" variants={fadeUp}>
                            <div className="pillar-card">
                                <div className="pillar-icon"><i className="fa-solid fa-masks-theater"></i></div>
                                <h3>No Fake Personas</h3>
                                <p>We encourage you to be unapologetically yourself. Show your weird habits, your true passions, and your real face. Authenticity is the ultimate magnet.</p>
                            </div>
                        </motion.div>

                        {/* Pillar 2 */}
                        <motion.div className="col-lg-4" variants={fadeUp}>
                            <div className="pillar-card active-pillar">
                                <div className="pillar-icon text-white"><i className="fa-solid fa-mug-hot"></i></div>
                                <h3 className="text-white">The 'One More Hour' Rule</h3>
                                <p className="text-white-50">Stop texting for weeks. We push our community to meet up for a quick coffee or walk. Spend an hour in real life instead of 10 hours chatting.</p>
                            </div>
                        </motion.div>

                        {/* Pillar 3 */}
                        <motion.div className="col-lg-4" variants={fadeUp}>
                            <div className="pillar-card">
                                <div className="pillar-icon"><i className="fa-solid fa-shield-heart"></i></div>
                                <h3>Safe & Respectful</h3>
                                <p>A good date starts with feeling safe. We have zero tolerance for bad behavior, ensuring our platform remains a secure space for everyone.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 4. CALL TO ACTION */}
            <section className="mission-cta text-center">
                <motion.div 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true }} 
                    variants={fadeUp}
                    className="container"
                >
                    <h2 className="fw-bold mb-4" style={{ fontSize: '2.5rem', color: '#0f172a' }}>Ready to find your vibe?</h2>
                    <Link to="/auth" state={{ form: 'signup' }} className="btn-join-mission">
                        Join the Community
                    </Link>
                </motion.div>
            </section>
        </div>
    );
};

export default MissionPage;