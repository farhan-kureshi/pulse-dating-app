import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AuthPage.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode = location.state?.form || 'login';

  // --- Auth & Navigation States ---
  const [mode, setMode] = useState(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [dob, setDob] = useState('');

  // --- Profile Setup States ---
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedInterestGender, setSelectedInterestGender] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('Add intent');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([null, null, null, null, null, null]);
  const [photoFiles, setPhotoFiles] = useState([null, null, null, null, null, null]);
  const [city, setCity] = useState('');
  const [college, setCollege] = useState('');
  const [job, setJob] = useState('');
  const [drinking, setDrinking] = useState('');

  // --- Auto Scroll to Top on Step Change ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showRules, showSetup, otpSent]);

  // --- Updated Strength Meter Logic ---
  const calculateStrength = () => {
    let score = 0;
    if (selectedGender && selectedInterestGender) score += 20; // Gender basics
    if (selectedIntent !== 'Add intent') score += 20; // Intent
    if (selectedInterests.length > 0) score += 20; // Interests
    if (bio.length > 10) score += 20; // Bio text
    // Check if at least 1 photo has been uploaded
    if (photos && photos.some(photo => photo !== null)) score += 20;

    return Math.min(100, score);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    // 👇 NAYA: Ab jab tak fix 10 digit nahi honge, OTP nahi bhejega
    if (phoneNumber.length === 10) {
      try {
        const res = await fetch('https://pulse-dating-app-4njq.onrender.com/api/send-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber })
        });

        if (res.ok) {
          setOtpSent(true);
          alert("OTP Sent On VS Code Terminal.");
        } else {
          alert("Error sending OTP");
        }
      } catch (error) {
        alert("Server Error. Please try again later");
      }
    } else {
      // Agar 10 se kam ya zyada hai toh error dikhayega
      alert("Not a valid phone number. Please enter exactly 10 digits.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length === 4) {
      try {
        const response = await fetch('https://pulse-dating-app-4njq.onrender.com/api/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, mode: mode, otp: otp })
        });
        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('user_id', data.user_id);
          if (mode === 'login') {
            localStorage.setItem('isAuthenticated', 'true');
            window.location.href = '/dashboard';
          } else {
            setShowSetup(true);
          }
        } else {
          alert("Error: " + data.error);
        }
      } catch (error) {
        alert("Server Error.");
      }
    } else {
      alert("Please enter the 4-digit OTP");
    }
  };

  // Handles the final step of profile setup, including image uploads
  const handleProfileSetup = async (e) => {
    e.preventDefault();

    // Retrieve the user_id saved during the OTP verification step
    const userId = localStorage.getItem('user_id');

    if (!userId) {
      alert("Error: User session not found. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('first_name', firstName);
    formData.append('gender', selectedGender);
    formData.append('intent', selectedIntent);
    formData.append('bio', bio);
    formData.append('city', city);
    formData.append('college', college);
    formData.append('job_title', job);
    formData.append('drinking_habit', drinking);
    formData.append('dob', dob);
    formData.append('interested_in', selectedInterestGender);

    // Convert the interests array into a comma-separated string for database storage
    if (selectedInterests.length > 0) {
      formData.append('interests', selectedInterests.join(', '));
    }

    // Append image files sequentially if they have been uploaded by the user
    photoFiles.forEach((file, index) => {
      if (file) {
        formData.append(`photo_${index + 1}`, file);
      }
    });

    try {
      // IMPORTANT: When using FormData, do NOT set the 'Content-Type' header.
      // The browser automatically sets it to 'multipart/form-data' with the correct boundary.
      const response = await fetch('https://pulse-dating-app-4njq.onrender.com/api/update-profile/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Profile Saved Successfully:", data.message);
        localStorage.setItem('isAuthenticated', 'true');
        window.location.href = '/dashboard'; // Redirect to dashboard
      } else {
        alert("Failed to save profile: " + data.error);
      }
    } catch (error) {
      console.error("API Connection Error:", error);
      alert("Unable to connect to the server. Please check your backend connection.");
    }
  };

  const agreeToRules = () => {
    setShowRules(false);
    setShowSetup(true);
  };

  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter(i => i !== tag));
    } else if (selectedInterests.length < 7) {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleBack = () => {
    if (showSetup) { setShowSetup(false); setShowRules(true); }
    else if (showRules) { setShowRules(false); setOtpSent(false); }
    else if (otpSent) { setOtpSent(false); }
    else { navigate('/'); }
  };

  const handlePhotoUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Save the preview URL for the UI (React display)
      const newPhotos = [...photos];
      newPhotos[index] = URL.createObjectURL(file);
      setPhotos(newPhotos);

      // 2. Save the actual File object to send to the Django backend
      const newPhotoFiles = [...photoFiles];
      newPhotoFiles[index] = file;
      setPhotoFiles(newPhotoFiles);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* LEFT SIDE: STICKY IMAGE */}
      <div className="auth-left">
        <div className="auth-quote">
          <h3>Find your vibe,<br />not just a match.</h3>
        </div>
      </div>

      {/* RIGHT SIDE: SCROLLABLE FORM */}
      <div className="auth-right position-relative">

        {/* Back Button */}
        <div className="back-button" onClick={handleBack}>
          <i className="fa-solid fa-arrow-left"></i>
        </div>

        <div className="form-container">

          {/* LOGO (Hidden in Rules/Setup to save space) */}
          {!showRules && !showSetup && (
            <div className="d-flex align-items-center mb-5 brand-logo">
              <img src="/pulseicon.jpeg" alt="PulseDate" style={{ height: '35px', borderRadius: '5px' }} />
              <span className="ms-2 fw-bold fs-4">PulseDate</span>
            </div>
          )}

          {/* =========================================
              PHASE 1: AUTH (Login / Signup)
          ========================================= */}
          {!showRules && !showSetup && (
            <div className="form-section fade-in">
              <h1 className="auth-title">{mode === 'signup' ? 'Join us.' : 'Welcome back.'}</h1>
              <p className="text-muted mb-4">
                {otpSent ? `Code sent to +91 ${phoneNumber}` : "Enter details to get started."}
              </p>

              <form onSubmit={otpSent ? handleVerify : handleSendOtp}>
                {mode === 'signup' && !otpSent && (
                  <div className="row">
                    <div className="col-6">
                      <div className="premium-input-container">
                        <input type="text" className="premium-input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="premium-input-container">
                        <input type="text" className="premium-input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                      </div>
                    </div>
                  </div>
                )}

                <div className="premium-input-container mb-4">
                  <span className="country-code-auth">+91</span>
                  <input
                    type="tel"
                    className="premium-input ps-5"
                    placeholder="Mobile number"
                    maxLength="10" /* 👇 NAYA: 10 se zyada type hi nahi hoga */
                    value={phoneNumber}
                    onChange={(e) => {
                      // 👇 NAYA: Text/Alphabets type hone se rokega, sirf number lega
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      setPhoneNumber(onlyNums);
                    }}
                    required
                  />
                </div>

                {otpSent && (
                  <div className="premium-input-container">
                    <input type="text" className="premium-input otp-input" placeholder="----" maxLength="4" onChange={(e) => setOtp(e.target.value)} required autoFocus />
                  </div>
                )}

                <button type="submit" className="btn btn-dark-solid w-100 mb-4 py-3 rounded-pill">
                  {otpSent ? 'Verify & Continue' : 'Send Code'}
                </button>
              </form>

              {!otpSent && (
                <>
                  <div className="d-flex align-items-center mb-4">
                    <hr className="flex-grow-1 opacity-25" /><span className="mx-3 text-muted small fw-bold">OR</span><hr className="flex-grow-1 opacity-25" />
                  </div>
                  {/* 👇 NAYA GOOGLE LOGIN BUTTON 👇 */}
                  <GoogleOAuthProvider clientId="312371188277-rf1p2ic4n0cgn9g0u6gusdnu4rk4n3lt.apps.googleusercontent.com
">
                    <div className="d-flex justify-content-center mb-3 w-100">
                      <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                          const decoded = jwtDecode(credentialResponse.credential);
                          console.log("Google User Data:", decoded);
                          // Yahan hum baad mein backend ka logic likhenge
                        }}
                        onError={() => {
                          console.log('Google Login Failed');
                          alert("Google Login Failed. Please try again.");
                        }}
                        useOneTap
                        shape="pill"
                        theme="filled_black"
                      />
                    </div>
                  </GoogleOAuthProvider>
                  <button className="btn btn-social w-100 mb-4 rounded-pill">
                    <i className="fa-brands fa-apple fs-4 me-2"></i> Continue with Apple
                  </button>
                  <p className="text-center text-muted">
                    {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}
                    <span className="fw-bold ms-2 text-decoration-underline" style={{ cursor: 'pointer' }} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setOtpSent(false); }}>
                      {mode === 'signup' ? 'Log in' : 'Sign up'}
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* =========================================
              PHASE 2: RULES (I Agree)
          ========================================= */}
          {showRules && !showSetup && (
            <div className="form-section text-center fade-in">
              <h2 className="auth-title">Welcome to PulseDate.</h2>
              <p className="text-muted mb-5">Please agree to our house rules to continue.</p>

              <div className="text-start mb-5 rules-list">
                <div className="d-flex mb-4">
                  <i className="fa-solid fa-check-circle me-3 fs-4 text-primary"></i>
                  <div><strong className="d-block h5 mb-0">Be yourself.</strong><span className="text-muted small">Make sure your photos and bio are true to you.</span></div>
                </div>
                <div className="d-flex mb-4">
                  <i className="fa-solid fa-check-circle me-3 fs-4 text-primary"></i>
                  <div><strong className="d-block h5 mb-0">Stay safe.</strong><span className="text-muted small">Don't be too quick to give out personal info.</span></div>
                </div>
                <div className="d-flex mb-4">
                  <i className="fa-solid fa-check-circle me-3 fs-4 text-primary"></i>
                  <div><strong className="d-block h5 mb-0">Play it cool.</strong><span className="text-muted small">Respect others and treat them well.</span></div>
                </div>
              </div>
              <button className="btn btn-dark-solid w-100 py-3 rounded-pill" onClick={agreeToRules}>I Agree</button>
            </div>
          )}

          {/* =========================================
              PHASE 3: SETUP PROFILE
          ========================================= */}
          {showSetup && (
            <div className="form-section pb-5 fade-in">
              {/* Strength Meter */}
              <div className="mb-5">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small fw-bold text-muted">Profile Strength</span>
                  <span className="small fw-bold" style={{ color: 'var(--accent-color)' }}>{calculateStrength()}%</span>
                </div>
                <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                  <div className="progress-bar" style={{ width: `${calculateStrength()}%`, backgroundColor: 'var(--accent-color)', transition: '0.5s' }}></div>
                </div>
              </div>

              <h2 className="auth-title mb-2">Set up profile, <span style={{ fontStyle: 'italic', color: 'var(--accent-color)' }}>{firstName}</span></h2>
              <p className="text-muted mb-5">Let's make your profile stand out.</p>

              <form onSubmit={handleProfileSetup}>

                {/* --- The Basics --- */}
                <h4 className="section-subtitle-premium">The Basics 📝</h4>
                <div className="form-floating mb-3">
                  <input
                    type="date"
                    className="form-control border-0 border-bottom rounded-0"
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                  <label htmlFor="dob">Birthday 🎂</label>
                </div>
                <div className="form-floating mb-4">
                  <input type="text" className="form-control border-0 border-bottom rounded-0" id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                  <label htmlFor="city">City / Neighborhood 📍</label>
                </div>

                <p className="small fw-bold text-muted mb-2">I am a 👤</p>
                <div className="d-flex gap-2 mb-4">
                  {['Man', 'Woman', 'Non-Binary'].map(g => (
                    <button key={g} type="button" className={`pill-btn-premium ${selectedGender === g ? 'active' : ''}`} onClick={() => setSelectedGender(g)}>{g}</button>
                  ))}
                </div>

                <p className="small fw-bold text-muted mb-2">Interested in 💖</p>
                <div className="d-flex gap-2 mb-5">
                  {['Men', 'Women', 'Everyone'].map(g => (
                    <button key={g} type="button" className={`pill-btn-premium ${selectedInterestGender === g ? 'active' : ''}`} onClick={() => setSelectedInterestGender(g)}>{g}</button>
                  ))}
                </div>

                {/* --- Identity & Lifestyle --- */}
                <h4 className="section-subtitle-premium">Identity & Lifestyle 🌿</h4>
                <div className="mb-4">
                  {/* Drinking Dropdown - Full Width */}
                  <select className="form-select border-0 border-bottom rounded-0 shadow-none py-3 w-100 text-muted" value={drinking} onChange={(e) => setDrinking(e.target.value)}>
                    <option value="" disabled>Drinking 🥂</option>
                    <option>Socially 🍻</option>
                    <option>Never 🚫</option>
                    <option>Frequently 🍷</option>
                    <option>Planning to quit 🛑</option>
                  </select>
                </div>
                <div className="form-floating mb-3">
                  <input type="text" className="form-control border-0 border-bottom rounded-0" placeholder="College" value={college} onChange={(e) => setCollege(e.target.value)} />
                  <label>College / University 🎓</label>
                </div>
                <div className="form-floating mb-5">
                  <input type="text" className="form-control border-0 border-bottom rounded-0" placeholder="Job" value={job} onChange={(e) => setJob(e.target.value)} />
                  <label>Job Title 💼</label>
                </div>

                {/* --- Your Vibe --- */}
                <h4 className="section-subtitle-premium">Your Vibe ✨</h4>
                <p className="small fw-bold text-muted mb-2">Relationship intent 💘</p>
                <button type="button" className="modal-trigger-premium mb-4" data-bs-toggle="modal" data-bs-target="#intentModal">
                  <span>{selectedIntent}</span><i className="fa-solid fa-pencil small"></i>
                </button>

                <p className="small fw-bold text-muted mb-2">My interests 🎨</p>
                <button type="button" className="modal-trigger-premium mb-3" data-bs-toggle="modal" data-bs-target="#interestModal">
                  <span>{selectedInterests.length > 0 ? `${selectedInterests.length} selected` : 'Add up to 7 interests'}</span><i className="fa-solid fa-pencil small"></i>
                </button>
                <div className="selected-tags-display mb-4">
                  {selectedInterests.map(tag => <span key={tag} className="vibe-badge">{tag}</span>)}
                </div>

                {/* --- Bio & Photos --- */}
                <h4 className="section-subtitle-premium">My Bio ✍️</h4>
                <textarea className="form-control bio-textarea-premium mb-5" rows="4" placeholder="Write something about yourself..." onChange={(e) => setBio(e.target.value)}></textarea>

                <h4 className="section-subtitle-premium">Photos 📸</h4>
                <div className="photo-grid-premium mb-5">
                  {photos.map((photoUrl, index) => (
                    <label key={index} className="photo-slot-premium" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, index)} />
                      {photoUrl ? (
                        <img src={photoUrl} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                      ) : (
                        <i className="fa-solid fa-plus fs-4"></i>
                      )}
                    </label>
                  ))}
                </div>

                <button type="submit" className="btn btn-dark-solid w-100 py-3 rounded-pill shadow-lg fs-5">Let's Go!</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <div className="modal fade" id="interestModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-4 rounded-5 border-0">
            <h5 className="text-center fw-bold mb-1 font-heading">What are you into?</h5>

            {/* Dynamic Selection Counter 👇 */}
            <p className="text-center text-muted small mb-4">{selectedInterests.length}/7 selected</p>

            <div className="d-flex flex-wrap gap-2 justify-content-center tag-cloud-premium">
              {[
                '☕ Coffee', '🐶 Dogs', '🐱 Cats', '🍕 Foodie', '✈️ Travel',
                '📸 Photography', '🎵 Spotify', '🎧 Podcasts', '🍿 Netflix',
                '🎬 Movies', '🎮 Gaming', '⚽ Football', '🏏 Cricket', '🏋️ Gym',
                '🧘‍♀️ Yoga', '📚 Reading', '🎨 Art', '👗 Fashion', '🥂 Nightlife',
                '🌿 Nature', '🚗 Cars', '💻 Coding', '🎸 Live Music', '🌶️ Spicy Food'
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`pill-btn-premium ${selectedInterests.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-dark-solid mt-4 rounded-pill py-3" data-bs-dismiss="modal">Save Interests</button>
          </div>
        </div>
      </div>

      <div className="modal fade" id="intentModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-4 rounded-5 border-0">
            <h5 className="text-center fw-bold mb-4 font-heading">Looking for?</h5>
            <div className="row g-2">
              {[
                { e: '💘', t: 'Long-term' }, { e: '🥂', t: 'Short-term' },
                { e: '👋', t: 'New friends' }, { e: '🤔', t: 'Still figuring it out' }
              ].map(item => (
                <div key={item.t} className="col-6" onClick={() => { setSelectedIntent(`${item.e} ${item.t}`) }}>
                  <div className={`intent-card-premium ${selectedIntent.includes(item.t) ? 'active' : ''}`}>
                    <div className="fs-1 mb-1">{item.e}</div>
                    <div className="fw-bold small">{item.t}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-dark-solid mt-4 rounded-pill py-3" data-bs-dismiss="modal">Save Intent</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;