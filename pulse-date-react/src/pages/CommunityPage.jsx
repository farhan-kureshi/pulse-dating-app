import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CommunityPage.css';

const CommunityPage = () => {
    const location = useLocation();
// ... baaki code

    // Page load hote hi screen top par aa jaye
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Animation Configurations
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

    const cardHover = {
        rest: { scale: 1, y: 0 },
        hover: { scale: 1.02, y: -8, transition: { duration: 0.3 } }
    };

    return (
        <div className="community-wrapper">
            {/* 1. NAVBAR */}
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
            <header className="community-hero">
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    variants={fadeUp} 
                    className="container text-center"
                >
                    <div className="badge-heart mb-4"><i className="fa-solid fa-heart me-2"></i> Better Together</div>
                    <h1 className="community-title">A community built on <br/><span className="text-rose-gradient">respect & kindness.</span></h1>
                    <p className="community-subtitle mx-auto mt-4">
                        PulseDate is more than just an app; it's a neighborhood. We believe in creating a positive, inclusive, and fun space for everyone looking to make real connections.
                    </p>
                </motion.div>
            </header>

            {/* 3. COMMUNITY GUIDELINES SECTION */}
            <section className="community-guidelines">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold" style={{ color: '#0f172a', fontSize: '2.5rem' }}>Our Golden Rules</h2>
                    </div>

                    <motion.div 
                        className="row g-4"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={staggerContainer}
                    >
                        {/* Rule 1 */}
                        <motion.div className="col-md-6" variants={fadeUp}>
                            <motion.div className="guideline-card" initial="rest" whileHover="hover" variants={cardHover}>
                                <div className="guideline-icon bg-rose-light text-rose"><i className="fa-solid fa-hand-holding-heart"></i></div>
                                <div>
                                    <h3>Be Kind & Respectful</h3>
                                    <p>Treat every match the way you want to be treated. Harassment, hate speech, or bullying of any kind will get you permanently banned. Zero warnings.</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Rule 2 */}
                        <motion.div className="col-md-6" variants={fadeUp}>
                            <motion.div className="guideline-card" initial="rest" whileHover="hover" variants={cardHover}>
                                <div className="guideline-icon bg-amber-light text-amber"><i className="fa-solid fa-face-laugh-beam"></i></div>
                                <div>
                                    <h3>Be Your Authentic Self</h3>
                                    <p>Don't pretend to be someone you aren't. Catfishing or using fake photos ruins the experience for everyone. Celebrate your unique quirks!</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Rule 3 */}
                        <motion.div className="col-md-6" variants={fadeUp}>
                            <motion.div className="guideline-card" initial="rest" whileHover="hover" variants={cardHover}>
                                <div className="guideline-icon bg-teal-light text-teal"><i className="fa-solid fa-comments"></i></div>
                                <div>
                                    <h3>Communicate Clearly</h3>
                                    <p>Ghosting isn't cool. If you are no longer interested, a polite "I don't think we're a match" goes a long way. Be clear about your intentions.</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Rule 4 */}
                        <motion.div className="col-md-6" variants={fadeUp}>
                            <motion.div className="guideline-card" initial="rest" whileHover="hover" variants={cardHover}>
                                <div className="guideline-icon bg-indigo-light text-indigo"><i className="fa-solid fa-earth-americas"></i></div>
                                <div>
                                    <h3>Embrace Diversity</h3>
                                    <p>Our community spans all backgrounds, orientations, and beliefs. Celebrate differences and keep an open mind when meeting new people.</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 4. JOIN CTA */}
            <section className="community-cta text-center">
                <motion.div 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true }} 
                    variants={fadeUp}
                    className="container"
                >
                    <h2 className="fw-bold mb-4" style={{ fontSize: '2.5rem', color: '#0f172a' }}>Agree with our vibe?</h2>
                    <p className="text-muted mb-5 fs-5">Join thousands of real people finding genuine connections today.</p>
                    <Link to="/auth" state={{ form: 'signup' }} className="btn-community-join">
                        I Agree, Let's Join <i className="fa-solid fa-arrow-right ms-2"></i>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
};

export default CommunityPage;