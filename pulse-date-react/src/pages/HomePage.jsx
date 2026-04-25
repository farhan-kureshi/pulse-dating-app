import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  // 1. Check if the page has already been loaded in this session to manage the preloader
  const [loading, setLoading] = useState(() => {
    return !sessionStorage.getItem('pulseDateLoaded');
  });

  useEffect(() => {
    let timer1, timer2;

    // --- Preloader Logic ---
    if (loading) {
      // Show the 2-second preloader if this is the user's first visit
      timer1 = setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.style.opacity = '0';
          preloader.style.visibility = 'hidden';
        }
        timer2 = setTimeout(() => {
          setLoading(false);
          sessionStorage.setItem('pulseDateLoaded', 'true'); // Save load status in browser session
        }, 800);
      }, 2000);
    } else {
      // Immediately hide the preloader if the page was already loaded (e.g., navigating back)
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.style.display = 'none';
      }
    }

    // --- Scroll Animation Logic (Always active) ---
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.scroll-animate');
    elementsToAnimate.forEach(element => observer.observe(element));

    // Cleanup memory to prevent memory leaks
    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [loading]);

  return (
    <>
      {/* 1. HEARTBEAT PRELOADER */}
      {loading && (
        <div id="preloader">
          <img src="/pulseicon.jpeg" alt="PulseDate Logo" className="pulse-logo" style={{ height: '80px', objectFit: 'contain' }} />
          <div className="preloader-text">PulseDate</div>
        </div>
      )}

      {/* 2. STICKY GLASSMORPHISM NAVBAR */}
      <nav className="navbar navbar-expand-lg aesthetic-nav">
        <div className="container-fluid position-relative d-flex align-items-center justify-content-between">
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse flex-grow-0" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link to="/mission" className="nav-link">Mission</Link>
              </li>
              <li className="nav-item">
                <Link to="/safety" className="nav-link">Safety</Link>
              </li>
              <li className="nav-item">
                <Link to="/community" className="nav-link">Community</Link>
              </li>
              {/* Mobile Only Buttons with State */}
              <li className="nav-item d-lg-none mt-3">
                <Link to="/auth" state={{ form: 'login' }} className="nav-link fw-bold">Log in</Link>
              </li>
              <li className="nav-item d-lg-none mt-2">
                <Link to="/auth" state={{ form: 'signup' }} className="btn btn-pill w-100 text-center">Join now</Link>
              </li>
            </ul>
          </div>

          {/* RELOAD FIX: Link tag prevents page refresh */}
          <Link to="/" className="navbar-brand position-absolute top-50 start-50 translate-middle d-flex align-items-center gap-2 m-0 text-decoration-none">
            <img src="/pulseicon.jpeg" alt="PulseDate Logo" style={{ height: '35px', objectFit: 'contain' }} />
            <span>PulseDate</span>
          </Link>

          {/* DESKTOP BUTTONS with State */}
          <div className="d-none d-lg-flex align-items-center gap-2 flex-grow-0">
            <Link to="/auth" state={{ form: 'login' }} className="btn-ghost">Log in</Link>
            <Link to="/auth" state={{ form: 'signup' }} className="btn-pill">Join now</Link>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="hero-section">
        <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80" alt="Friends laughing" className="hero-bg-image" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Find your vibe,<br />not just a match.</h1>
          <p className="hero-subtitle">We believe real connections happen when you can be yourself. Join a community designed for genuine interactions and meaningful relationships.</p>
          <Link to="/auth" state={{ form: 'signup' }} className="btn-pill" style={{ padding: '14px 35px', fontSize: '1.1rem' }}>Create account</Link>
        </div>
      </section>

      {/* 4. MIDDLE CONTENT */}
      <section className="feature-section text-center scroll-animate reveal-up">
        <div className="container">
          <h2 className="font-heading fw-bold" style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', letterSpacing: '-1px' }}>
            Go on your first date.
          </h2>
          <p className="mx-auto mt-4 text-muted" style={{ maxWidth: '650px', fontSize: '1.15rem', lineHeight: '1.7' }}>
            PulseDate is built on the belief that anyone looking for genuine connection should be able to find it. We succeed when we get you off the app and on a promising date.
          </p>
        </div>
      </section>

      <section className="feature-section pt-0 overflow-hidden">
        <div className="container">
          <div className="row align-items-center mb-5 pb-5">
            <div className="col-lg-5 pe-lg-5 mb-4 mb-lg-0 scroll-animate reveal-left">
              <p className="text-muted fw-bold mb-2" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Authentic Profiles</p>
              <h2 className="font-heading fw-bold mb-4" style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', lineHeight: '1.1' }}>Show your true self.</h2>
              <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                Profiles that go beyond just a photo. Share your passions, your weird habits, and your favorite weekend spots. We match you based on what actually matters.
              </p>
            </div>
            <div className="col-lg-7 scroll-animate reveal-right">
              <img src="/cn2.avif" alt="Profile with photo" className="img-aesthetic shadow-lg" />
            </div>
          </div>

          <div className="row align-items-center flex-column-reverse flex-lg-row pt-4">
            <div className="col-lg-7 scroll-animate reveal-left">
              <img src="/cn3.avif" alt="Couple on a date" className="img-aesthetic shadow-lg" />
            </div>
            <div className="col-lg-5 ps-lg-5 mt-4 mt-lg-0 mb-4 mb-lg-0 scroll-animate reveal-right">
              <p className="text-muted fw-bold mb-2" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>One More Hour</p>
              <h2 className="font-heading fw-bold mb-4" style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', lineHeight: '1.1' }}>Dates that actually happen.</h2>
              <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                An impact initiative to foster IRL connections. We want you to spend less time swiping and more time living your life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="aesthetic-footer scroll-animate reveal-up">
        <div className="container">
          <div className="row mb-5">
            <div className="col-lg-4 mb-5 mb-lg-0">
              <h2 className="font-heading fw-bold text-white mb-3 d-flex align-items-center">
                <img src="/pulseicon.jpeg" alt="PulseDate Logo" style={{ height: '40px', objectFit: 'contain', marginRight: '12px', borderRadius: '5px' }} />
                PulseDate
              </h2>
              <p className="text-white-50 small pe-lg-4 mb-4" style={{ lineHeight: '1.6' }}>
                The matchmaking platform designed for genuine connections and real-life dates. Don't just swipe, find your vibe.
              </p>

              <div className="social-links">
                <a href="https://www.instagram.com/farhan_kureshi2607/" target="_blank" rel="noopener noreferrer" title="Instagram">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="https://www.linkedin.com/in/farhankureshi/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <i className="fa-brands fa-linkedin-in"></i>
                </a>
                <a href="https://x.com/Farhan_Kureshi7" target="_blank" rel="noopener noreferrer" title="Twitter">
                  <i className="fa-brands fa-twitter"></i>
                </a>
              </div>
            </div>

            <div className="col-lg-2 col-6 mb-4 mb-lg-0">
              <h6 className="text-white mb-4 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Company</h6>
              <ul className="list-unstyled footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press & Media</a></li>
              </ul>
            </div>

            <div className="col-lg-2 col-6 mb-4 mb-lg-0">
              <h6 className="text-white mb-4 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Resources</h6>
              <ul className="list-unstyled footer-links">
                <li><a href="#">Safe Dating Tips</a></li>
                <li><a href="#">FAQ & Help</a></li>
                <li><a href="#">Success Stories</a></li>
              </ul>
            </div>

            <div className="col-lg-4 mb-4 mb-lg-0">
              <h6 className="text-white mb-4 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Legal</h6>
              <ul className="list-unstyled footer-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Accessibility</a></li>
              </ul>
            </div>
          </div>

          <hr className="border-secondary opacity-25 my-4" />

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="text-white-50 small mb-0">© 2026 Pulse Circle. All rights reserved.</p>
            <div className="mt-3 mt-md-0 d-flex gap-3 align-items-center text-white-50 small">
              <span style={{ cursor: 'pointer', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = ''}>
                <i className="fa-solid fa-globe me-1"></i> English (IN)
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;