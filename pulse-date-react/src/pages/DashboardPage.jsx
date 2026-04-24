import React, { useState, useEffect, useRef } from 'react';
import './DashboardPage.css';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import PremiumModal from './PremiumModal';
import EmojiPicker from 'emoji-picker-react';
const DashboardPage = () => {
    // --- CORE STATES ---
    const [activeTab, setActiveTab] = useState('matches');
    // --- SIDEBAR DATA STATE ---
    const [sidebarData, setSidebarData] = useState({ matches: [], liked_you: [] });
    const [profiles, setProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [profileIndex, setProfileIndex] = useState(0);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(null);

    // --- MATCH CELEBRATION STATES ---
    const [showMatch, setShowMatch] = useState(false);
    const [matchedProfile, setMatchedProfile] = useState(null);

    // --- EDIT PROFILE STATES (CLEANED & ORGANIZED) ---
    // Basic Info
    const [userName, setUserName] = useState("Loading...");
    const [editLastName, setEditLastName] = useState("");
    const [userMobile, setUserMobile] = useState(""); // Mobile usually change nahi hota par dikha sakte hain
    const [editDob, setEditDob] = useState("");
    const [mainDp, setMainDp] = useState("/default-avatar.png");
    const [editBio, setEditBio] = useState("");

    // Lifestyle & Details
    const [editCity, setEditCity] = useState("");
    const [editCollege, setEditCollege] = useState("");
    const [editJob, setEditJob] = useState("");
    const [editDrinking, setEditDrinking] = useState("");

    // Vibe & Intent
    const [editIntent, setEditIntent] = useState({ icon: '💘', text: 'Long-term partner' });
    const [editInterests, setEditInterests] = useState([]);

    // Photos (Initialized as empty/null, no dummy photos)
    const [editPhotos, setEditPhotos] = useState([null, null, null, null, null, null]);
    const [editPhotoFiles, setEditPhotoFiles] = useState([null, null, null, null, null, null]);
    const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar toggle ke liye
    const [searchQuery, setSearchQuery] = useState(""); // Search bar ke liye

    // --- CHAT STATES (NAYE) ---
    const [chatMessages, setChatMessages] = useState([]); // Database ke messages store karne ke liye
    const [newMessageText, setNewMessageText] = useState(""); // Input box mein jo type hoga uske liye
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const fileInputRef = useRef(null);

    const [activeChatList, setActiveChatList] = useState([]);
    const [chatSocket, setChatSocket] = useState(null); // WebSocket store karne ke liye

    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

    // --- VIDEO CALL STATES & REFS ---
    const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'ringing', 'calling', 'connected'
    const [incomingOffer, setIncomingOffer] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);

    const [callType, setCallType] = useState('video'); // Track karega ki call Audio hai ya Video

    // --- AUDIO & RINGTONE REFS ---
    const ringtoneRef = useRef(new Audio('/ringtone.mp3')); // Call ke liye
    const msgToneRef = useRef(new Audio('/msg_tone.mp3'));   // Message ke liye
    const [zoomImage, setZoomImage] = useState(null); // 👈 Badi image dikhane ke liye
    const prevUnreadCountRef = useRef(0); // Puraane unread messages yaad rakhne ke liye
    const [activeMsgId, setActiveMsgId] = useState(null); // Kis message par click hua hai

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [isPremium, setIsPremium] = useState(false);

    const [selectedLikedProfile, setSelectedLikedProfile] = useState(null);
    // --- FETCH REAL USER DATA ON DASHBOARD LOAD ---
    useEffect(() => {
        const fetchUserData = async () => {
            const userId = localStorage.getItem('user_id');

            if (!userId) {
                console.error("No User ID found in session.");
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/get-profile/${userId}/`);
                const data = await response.json();

                if (response.ok) {
                    // 1. Update text and lifestyle fields
                    setUserName(data.first_name || "User");
                    setEditLastName(data.last_name || ""); // 👈 Add this
                    setUserMobile(data.phone_number || ""); // 👈 Add this
                    setIsPremium(data.is_premium);
                    setEditDob(data.dob || ""); // 👈 Add thi
                    setEditBio(data.bio || "");
                    setEditCity(data.city || "");
                    setEditCollege(data.college || "");
                    setEditJob(data.job_title || "");
                    setEditDrinking(data.drinking_habit || "");

                    // 2. Parse Intent (Extract icon and text correctly)
                    if (data.intent) {
                        const icon = data.intent.split(' ')[0];
                        const text = data.intent.split(' ').slice(1).join(' ');
                        setEditIntent({ icon, text });
                    }

                    // 3. Parse Interests (Convert string back to array)
                    if (data.interests) {
                        setEditInterests(data.interests.split(', '));
                    }

                    // 4. Setup Profile Picture and ALL 6 Photos in the Grid
                    setEditPhotos((prevPhotos) => {
                        const updatedPhotos = [...prevPhotos];
                        for (let i = 1; i <= 6; i++) {
                            const photoUrl = data[`photo_${i}`];
                            if (photoUrl) {
                                updatedPhotos[i - 1] = `http://127.0.0.1:8000${photoUrl}`;
                            }
                        }
                        return updatedPhotos;
                    });

                    // Sidebar DP hamesha photo_1 rahegi
                    if (data.photo_1) {
                        setMainDp(`http://127.0.0.1:8000${data.photo_1}`);
                    }

                }
                else {
                    console.error("Failed to fetch profile details:", data.error);
                }
            } catch (error) {
                console.error("API Connection Error:", error);
            }
        };

        fetchUserData();
    }, []);

    // --- FETCH DISCOVERY PROFILES (Baaqi Logon Ka Data) ---

    // 1. Function ko bahar nikala gaya hai (Bina kisi outer useEffect ke)
    const fetchDiscoveryProfiles = async () => {
        setLoadingProfiles(true);
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        try {
            // URL mein Age aur Gender pass kar rahe hain
            const response = await fetch(`http://127.0.0.1:8000/api/discovery/${userId}/?age=${age}&gender=${preferredGender}`);
            const data = await response.json();

            if (response.ok) {
                setProfiles(data);
                setProfileIndex(0);
                setPhotoIndex(0);
            }
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setLoadingProfiles(false);
        }
    };

    // 2. useEffect alag se likha gaya hai (Function ke niche)
    useEffect(() => {
        fetchDiscoveryProfiles();
    }, []);


    // --- FETCH SIDEBAR DATA (Matches & Liked You) ---
    useEffect(() => {
        const fetchSidebarData = async () => {
            const userId = localStorage.getItem('user_id');
            if (!userId) return;

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/sidebar-data/${userId}/`);
                const data = await response.json();

                if (response.ok) {
                    setSidebarData(data); // Asli Matches aur Likes save ho gaye!
                }
            } catch (error) {
                console.error("Sidebar Fetch Error:", error);
            }
        };

        fetchSidebarData();
    }, [activeTab, showMatch]); // Jab bhi tab badlega ya match hoga, yeh naya data layega



    // 👇 YEH AI GENERATOR FUNCTION ADD KAREIN 👇
    const generateSmartBio = () => {
        if (editInterests.length === 0) {
            setEditBio("I'm a mystery! Let's chat and find out more about me. 🕵️‍♂️");
            return;
        }

        // Random funny templates based on user's interests
        const templates = [
            `If we match, we are definitely doing ${editInterests[0]} together! Bonus points if you also love ${editInterests[1] || 'good food'}. 😉`,
            `Looking for someone to share my unhealthy obsession with ${editInterests[0]}. Swipe right and let's vibe! ✨`,
            `I promise I'm better at ${editInterests[0]} than my profile suggests. Currently looking for a ${editInterests[1] || 'travel'} buddy! 🌍`,
            `My personality is 50% ${editInterests[0]} and 50% trying to find the best ${editInterests[1] || 'coffee'} in town. ☕`,
            `Swipe right if you can handle my endless talk about ${editInterests[0]}! 🚀`
        ];

        // Randomly ek template pick karo aur Bio update kardo
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setEditBio(randomTemplate);
    };
    // 👇 YEH NAYA FUNCTION BAHAR HONA CHAHIYE 👇
    const calculateProfileCompletion = () => {
        let score = 0;

        // 1. Basic Info (Name & Photo) = 30%
        if (userName && userName !== "Loading..." && userName !== "User") score += 10;
        if (mainDp && !mainDp.includes("default-avatar.png")) score += 20;

        // 2. Identity & Lifestyle = 40%
        if (editBio && editBio.length > 5) score += 10;
        if (editCity) score += 10;
        if (editJob) score += 10;
        if (editCollege || editDrinking) score += 10;

        // 3. Vibe & Interests = 20%
        if (editIntent && editIntent.text !== "Add intent") score += 10;
        if (editInterests && editInterests.length > 0) score += 10;

        // 4. Extra Photos = 10%
        const uploadedPhotosCount = editPhotos.filter(photo => photo !== null).length;
        if (uploadedPhotosCount > 1) score += 10;

        return Math.min(100, score);
    };
    // --- PHOTO UPLOAD HANDLER FOR EDIT PROFILE ---
    const handleEditPhotoUpload = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            // 1. Show preview in the UI
            const newPhotos = [...editPhotos];
            newPhotos[index] = URL.createObjectURL(file);
            setEditPhotos(newPhotos);

            // 2. Save the actual file to send to the backend later
            const newPhotoFiles = [...editPhotoFiles];
            newPhotoFiles[index] = file;
            setEditPhotoFiles(newPhotoFiles);
        }
    };
    // --- SAVE CHANGES TO DATABASE ---
    const handleSaveChanges = async () => {
        console.log("Button Clicked!");
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            alert("Bhai, User ID nahi mila! Dobara login karo.");
            return;
        }
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('first_name', userName);
        formData.append('last_name', editLastName);
        formData.append('dob', editDob);
        formData.append('bio', editBio);
        formData.append('intent', `${editIntent.icon} ${editIntent.text}`); // Combine icon and text

        // Add new fields to the form data
        formData.append('city', editCity);
        formData.append('college', editCollege);
        formData.append('job_title', editJob);
        formData.append('drinking_habit', editDrinking);

        if (editInterests.length > 0) {
            formData.append('interests', editInterests.join(', '));
        }

        // ... (Keep your photo upload code below this)

        // Add photos if the user uploaded new ones in the edit panel
        // Append all 6 image files if they exist
        editPhotoFiles.forEach((file, index) => {
            if (file) {
                formData.append(`photo_${index + 1}`, file);
            }
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/api/update-profile/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert("Profile successfully updated in Database!");
                closeSidePanel(); // Close the edit panel

                // Optional: Refresh the page to show new data immediately
                window.location.reload();
            } else {
                alert("Backend Error: " + data.error);
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("Could not connect to the server.");
        }
    };


    const handleMainDpUpload = (e) => {
        const file = e.target.files[0];
        if (file) setMainDp(URL.createObjectURL(file));
    };

    // --- NEW STATES (Panels) ---
    const [activePanel, setActivePanel] = useState('discovery'); // 'discovery', 'profile', 'chat'
    const [chatData, setChatData] = useState(null); // Jis chat ko kholenge uska data yahan aayega

    const currentProfile = profiles[profileIndex];
    // --- DRAG & SWIPE LOGIC ---
    const x = useMotionValue(0); // Card ki horizontal position

    // Jaise-jaise card move hoga, uska color aur rotation change hoga
    const rotate = useTransform(x, [-150, 0, 150], [-25, 0, 25]);
    const opacity = useTransform(x, [-150, -50, 0, 50, 150], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event, info) => {
        // Agar card 100px se zyada right gaya -> LIKE
        if (info.offset.x > 100) {
            handleSwipe('right');
        }
        // Agar card 100px se zyada left gaya -> NOPE
        else if (info.offset.x < -100) {
            handleSwipe('left');
        }
    };

    // --- HANDLERS ---
    const handlePhotoTap = (direction) => {
        let newIndex = photoIndex + direction;
        if (newIndex >= 0 && newIndex < currentProfile.photos.length) {
            setPhotoIndex(newIndex);
        }
    };


    // --- REAL SWIPE ALGORITHM ---
    const handleSwipe = async (direction) => {
        setSwipeDirection(`swipe-${direction}`); // Animation start

        const userId = localStorage.getItem('user_id');
        const swipedProfile = selectedLikedProfile ? selectedLikedProfile : profiles[profileIndex];
        let isMatch = false;

        // Backend API Call (Data Saving)
        if (userId && swipedProfile) {
            const isLike = (direction === 'right' || direction === 'up');
            const isSuperLike = (direction === 'up'); // 👇 NAYA: Check karo kya up swipe tha?

            try {
                const response = await fetch('http://127.0.0.1:8000/api/swipe/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        swiper_id: userId,
                        swiped_on_id: swipedProfile.id,
                        is_like: isLike,
                        is_superlike: isSuperLike // 👇 NAYA: Database ko batao
                    })
                });

                const data = await response.json();

                if (response.ok && data.match) {
                    isMatch = true; // Backend ne bataya ki dono ne ek dusre ko Like kiya hai!
                    setMatchedProfile(swipedProfile);
                }
            } catch (error) {
                console.error("API Error:", error);
            }
        }

        // 400ms ke baad decide karo kya karna hai
        setTimeout(() => {
            if (isMatch) {
                setShowMatch(true);
            } else {
                setSwipeDirection(null);
                setPhotoIndex(0);

                // 👇 NAYA: Agar 'Liked You' wali profile ko pass kar diya, toh wapas normal cards par aa jao
                if (selectedLikedProfile) {
                    setSelectedLikedProfile(null);
                } else {
                    setProfileIndex((prev) => (prev + 1) % profiles.length);
                }
            }
        }, 400);
    };

    // Super Like Button ke liye
    const celebrateMatch = () => {
        handleSwipe('up');
    };
    // --- SKIP PROFILE LOGIC ---
    const skipToNextProfile = () => {
        if (profiles.length > 0) {
            setPhotoIndex(0); // Nayi profile par pehla photo dikhe
            setProfileIndex((prev) => (prev + 1) % profiles.length);
        }
    };

    const skipToPrevProfile = () => {
        if (profiles.length > 0) {
            setPhotoIndex(0);
            setProfileIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
        }
    };
    // Match screen band hone ke baad agle profile par jana
    const closeCelebration = () => {
        setShowMatch(false);
        setTimeout(() => {
            setSwipeDirection(null);
            setPhotoIndex(0);
            setSelectedLikedProfile(null); // 👈 NAYI LINE
            setProfileIndex((prev) => (prev + 1) % profiles.length);
        }, 300);
    };;

    // --- PANEL HANDLERS (New) ---
    const openMyProfile = () => setActivePanel('profile');

    const closeSidePanel = () => setActivePanel('discovery'); // Wapas swipe screen par aane ke liye
    // --- LOGOUT FUNCTION ---
    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            localStorage.clear(); // Saara login data delete kar do
            window.location.href = '/'; // User ko wapas Home page par bhej do
        }
    };
    // Settings kholne par blocked users lana
    const fetchBlockedUsers = async () => {
        const userId = localStorage.getItem('user_id');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/blocked-users/${userId}/`);
            if (response.ok) {
                const data = await response.json();
                setBlockedUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch blocked users", error);
        }
    };

    const handleUnblock = async (blockedId) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/unblock-user/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blocker_id: localStorage.getItem('user_id'),
                    blocked_id: blockedId
                })
            });

            if (response.ok) {
                alert("User Unblocked! They are back in your Matches list. 🎉");
                fetchBlockedUsers(); // List ko refresh karo
                window.location.reload(); // Dashboard refresh karo taaki wapas dikhne lagein
            }
        } catch (error) {
            console.error("Failed to unblock", error);
        }
    };
    // ==========================================
    // WEBRTC VIDEO CALL LOGIC (THE BOSS LEVEL)
    // ==========================================

    // Engine ab parameter lega ki Video chalana hai ya nahi
    const setupMediaAndPeer = async (isVideoCall = true) => {
        const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerRef.current = peer;

        try {
            // 👇 NAYA: Agar audio call hai, toh video: false ho jayega
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        } catch (error) {
            console.warn("Media lock error:", error);
        }

        peer.ontrack = (event) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        peer.onicecandidate = (event) => {
            if (event.candidate && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                chatSocket.send(JSON.stringify({ type: 'ice_candidate', sender_id: localStorage.getItem('user_id'), data: event.candidate }));
            }
        };
        return peer;
    };

    const startVideoCall = async () => {
        setCallType('video');
        setCallStatus('calling');
        const peer = await setupMediaAndPeer(true);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        chatSocket.send(JSON.stringify({ type: 'webrtc_offer', sender_id: localStorage.getItem('user_id'), data: offer, call_type: 'video' }));
    };

    // 👇 NAYA: Audio Call Function
    const startAudioCall = async () => {
        setCallType('audio');
        setCallStatus('calling');
        const peer = await setupMediaAndPeer(false);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        chatSocket.send(JSON.stringify({ type: 'webrtc_offer', sender_id: localStorage.getItem('user_id'), data: offer, call_type: 'audio' }));
    };

    // acceptVideoCall ka naam badal kar sirf acceptCall kar diya
    const acceptCall = async () => {
        ringtoneRef.current.pause();         // 👈 Ringtone roko
        ringtoneRef.current.currentTime = 0; // 👈 Wapas shuru se set karo
        setCallStatus('connected');
        const peer = await setupMediaAndPeer(callType === 'video'); // Call type check karke camera start karega
        await peer.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        chatSocket.send(JSON.stringify({ type: 'webrtc_answer', sender_id: localStorage.getItem('user_id'), data: answer }));
    };

    const endVideoCall = (isSender = true) => {
        ringtoneRef.current.pause();         // 👈 Ringtone roko
        ringtoneRef.current.currentTime = 0; // 👈 Wapas shuru se set karo
        setCallStatus('idle');
        setIncomingOffer(null);

        // Peer connection band karo
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        // Camera aur Mic band karo
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // 👇 NAYA: Agar maine phone kata hai, toh samne wale ko bhi batao "Call End ho gayi"
        if (isSender && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({
                type: 'webrtc_end_call',
                sender_id: localStorage.getItem('user_id')
            }));
        }
    };

    const openChat = (matchId, name, avatar) => {
        // 👇 NAYA LOGIC: Nayi chat khulte hi purane bande ka status aur typing RESET kar do
        setIsOtherUserOnline(false);
        setIsOtherUserTyping(false);
        setChatMessages([]); // Taki Faizan ki chat me Sammanta ke messages 1 second ke liye flash na ho

        setChatData({ matchId, name, avatar }); // Naya matchId save kiya
        setActivePanel('chat');
        setIsSidebarMobileOpen(false);
        fetchMessages(matchId); // Chat khulte hi database se messages le aao!
    };
    // Purane messages mangwane ke liye
    const fetchMessages = async (otherUserId) => {
        const userId = localStorage.getItem('user_id'); // Apna ID nikala
        try {
            // API url mein ?user_id= karke apna ID bhi bhej diya
            const response = await fetch(`http://127.0.0.1:8000/api/chat/${otherUserId}/?user_id=${userId}`);
            const data = await response.json();
            if (response.ok) {
                setChatMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };
    // --- REAL-TIME CHAT (WEBSOCKETS) ---
    useEffect(() => {
        let ws;

        if (activePanel === 'chat' && chatData?.matchId) {
            // Chat open hote hi pehle purane messages database se laao
            fetchMessages(chatData.matchId);
            const userId = localStorage.getItem('user_id');
            // Naya WebSocket (Live Pipe) connection banao
            ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatData.matchId}/?user_id=${userId}`);
            ws.onopen = () => {
                console.log("WebSocket Connected Successfully! 🚀");
            };

            // Jab backend se direct naya message ya signal aaye
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'messages_read_event') {
                    setChatMessages((prev) => prev.map(msg => ({ ...msg, is_read: true })));
                }
                else if (data.type === 'chat_message') {
                    setChatMessages((prev) => [...prev, data]);

                    // Agar message samne wale ne bheja hai, toh Aawaz bajao aur Read mark karo
                    if (data.sender != userId) {
                        ws.send(JSON.stringify({ type: 'mark_read' }));

                        // 👇 NAYA: Message Tone Play Karo 👇
                        msgToneRef.current.play().catch(e => console.log("Audio blocked by browser", e));
                    }
                }
                // 👇 NAYA: Typing signal handle karna
                else if (data.type === 'typing' && data.sender_id != userId) {
                    setIsOtherUserTyping(data.is_typing);
                }
                // 👇 NAYA: Online/Offline status handle karna aur Echo bhejna
                else if (data.type === 'user_status' && data.user_id != userId) {
                    setIsOtherUserOnline(data.status === 'online');

                    // Agar saamne wala naya aaya hai, toh usey batao ki "Main bhi pehle se yahan hu!" (Echo)
                    if (data.status === 'online' && !data.is_echo) {
                        ws.send(JSON.stringify({
                            type: 'user_status',
                            status: 'online',
                            sender_id: userId,
                            is_echo: true
                        }));
                    }
                }

                else if (data.type === 'webrtc_offer' && data.sender_id != userId) {
                    setIncomingOffer(data.data);
                    setCallType(data.call_type || 'video');
                    setCallStatus('ringing');

                    // 👇 NAYA: Ringtone bajana shuru karo (Loop me) 👇
                    ringtoneRef.current.loop = true;
                    ringtoneRef.current.play().catch(e => console.log("Audio blocked", e));
                }
                else if (data.type === 'webrtc_answer' && data.sender_id != userId) {
                    setCallStatus('connected');
                    if (peerRef.current) {
                        peerRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
                    }
                }
                else if (data.type === 'ice_candidate' && data.sender_id != userId) {
                    if (peerRef.current) {
                        peerRef.current.addIceCandidate(new RTCIceCandidate(data.data)).catch(e => console.log(e));
                    }
                }

                // 👇 NAYA: Agar samne wale ne phone kaat diya hai, toh apna bhi End kar do (bina signal bheje loop bachane ke liye)
                else if (data.type === 'webrtc_end_call' && data.sender_id != userId) {
                    endVideoCall(false); // isSender = false bheja taki wapas signal na jaye
                }

                // 👇 NAYA: Delete Handle Karna (ID Fix)
                else if (data.type === 'message_deleted') {
                    setChatMessages((prev) => prev.map(msg =>
                        msg.id == data.message_id ? { ...msg, is_deleted: true } : msg // 👈 `==` lagaya
                    ));
                }
                // 👇 NAYA: Reaction Handle Karna (ID Fix)
                else if (data.type === 'message_reaction') {
                    setChatMessages((prev) => prev.map(msg =>
                        msg.id == data.message_id ? { ...msg, reaction: data.reaction } : msg // 👈 `==` lagaya
                    ));
                }
            };

            setChatSocket(ws);
        }

        // Jab chat panel close ho, toh pipe tod do
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [activePanel, chatData]);

    // Fetch Active Chat List for Sidebar (WITH AUTO-REFRESH & NOTIFICATION SOUND)
    useEffect(() => {
        const fetchChatList = async () => {
            const userId = localStorage.getItem('user_id');
            if (!userId) return;
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/chat-list/${userId}/`);
                if (response.ok) {
                    const data = await response.json();
                    setActiveChatList(data);

                    // 👇 NAYA LOGIC: Check karo ki kya koi naya message aaya hai?
                    const currentTotalUnread = data.reduce((sum, chat) => sum + chat.unread_count, 0);

                    // Agar total unread messages badh gaye hain, aur chat panel open nahi hai
                    if (currentTotalUnread > prevUnreadCountRef.current && activePanel !== 'chat') {
                        // Pop Sound bajao!
                        if (msgToneRef.current) {
                            msgToneRef.current.play().catch(e => console.log("Audio play blocked", e));
                        }
                    }
                    // Current count ko yaad rakho agle round ke liye
                    prevUnreadCountRef.current = currentTotalUnread;
                }
            } catch (error) {
                console.error("Chat list fetch error:", error);
            }
        };

        let listInterval;
        if (activeTab === 'messages') {
            fetchChatList();
            listInterval = setInterval(fetchChatList, 3000); // 3 sec polling
        }

        return () => {
            if (listInterval) clearInterval(listInterval);
        };
    }, [activeTab, activePanel, chatMessages]); // activePanel aur chatMessages add kiya taaki latest state mile

    // 👇 NAYA: Gallery open karne aur image select karne ka logic
    const handleAttachClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files); // Saari selected files ko array mein badla
        if (files.length > 0) {
            setSelectedImages((prev) => [...prev, ...files]); // Purani images ke saath nayi add kardi
        }
    };
    // Kisi ek image ko remove karne ke liye function:
    const removeImage = (index) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    };
    const handleSendMessage = () => {
        if (!newMessageText.trim() && selectedImages.length === 0) return;

        const userId = localStorage.getItem('user_id');

        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {

            // 1. Agar Images hain, toh har image ke liye loop chalao
            if (selectedImages.length > 0) {
                selectedImages.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        chatSocket.send(JSON.stringify({
                            'message': index === 0 ? newMessageText : "", // Sirf pehli image ke sath text bhej rahe hain (Optional)
                            'sender_id': userId,
                            'image_data': reader.result,
                            'file_name': file.name
                        }));
                    };
                    reader.readAsDataURL(file);
                });
            }
            // 2. Agar sirf text hai toh normal bhej do
            else if (newMessageText.trim()) {
                chatSocket.send(JSON.stringify({
                    'message': newMessageText,
                    'sender_id': userId
                }));
            }

            // Sab khali kar do
            setNewMessageText("");
            setSelectedImages([]);
        }
    };

    const handleReact = (msgId, reactionEmoji) => {
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({ type: 'react_message', message_id: msgId, reaction: reactionEmoji }));
            setActiveMsgId(null); // Menu band kardo
        }
    };

    const handleDelete = (msgId) => {
        const confirmDelete = window.confirm("Delete this message for everyone?");
        if (confirmDelete && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({ type: 'delete_message', message_id: msgId }));
            setActiveMsgId(null);
        }
    };
    const handleBlockUser = async () => {
        const confirmBlock = window.confirm("Report & Block this user? They will be removed from your matches permanently.");
        if (confirmBlock) {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/block-user/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        blocker_id: localStorage.getItem('user_id'),
                        blocked_id: chatData.matchId
                    })
                });

                if (response.ok) {
                    alert("User has been reported and blocked. 🛡️");
                    closeSidePanel(); // Chat band kardo
                    window.location.reload(); // Page refresh kardo taaki matches update ho jayein
                }
            } catch (error) {
                console.error("Failed to block user:", error);
            }
        }
    };
    // 👇 Isme 'plan' variable aayega (jaise '1month', '6months', '12months')
    const handlePayment = async (selectedPlan) => {
        let amount = 499;
        let months = 1;

        if (selectedPlan === '6months') { amount = 249 * 6; months = 6; }
        if (selectedPlan === '12months') { amount = 149 * 12; months = 12; }

        // 1. Backend ko dynamic amount bhejo
        const res = await fetch('http://127.0.0.1:8000/api/create-order/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount })
        });
        const order = await res.json();

        const options = {
            key: "rzp_test_SgzTfh4Rj34CWK", // Apni Test Key ID daalein
            amount: order.amount,
            currency: order.currency,
            name: "Pulse Date VIP",
            description: `Premium Access for ${months} Months`,
            order_id: order.id,
            handler: async function (response) {
                // 2. Success hone par backend ko mahine bhejo taaki expiry date set ho
                const verifyRes = await fetch('http://127.0.0.1:8000/api/verify-payment/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        user_id: localStorage.getItem('user_id'),
                        months: months // 👈 Mahine bhej diye!
                    })
                });
                const data = await verifyRes.json();
                if (verifyRes.ok) {
                    alert(data.message);
                    setShowPremiumModal(false);
                    window.location.reload(); // Page refresh karo taaki sab unblur ho jaye
                }
            },
            theme: { color: "#fd5c63" }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    };

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [distance, setDistance] = useState(25);
    const [age, setAge] = useState(24);
    const [preferredGender, setPreferredGender] = useState('Everyone');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    return (
        <div className={`dashboard-wrapper ${isDarkMode ? 'dark-theme' : ''}`}>
            {/* =========================================
                LEFT SIDEBAR (Matches & Messages)
            ========================================= */}
            <aside className={`sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

                {/* User Header */}
                <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* 👇 NAYA: Hamburger Menu (3-Lines) 👇 */}
                    <div className="menu-toggle" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
                        <i className="fa-solid fa-bars fs-4 text-white"></i>
                    </div>

                    {/* DYNAMIC PROGRESS BAR (Hide when collapsed) */}
                    {!isCollapsed && (
                        <div className="user-profile-btn flex-grow-1" onClick={openMyProfile} style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={mainDp} alt="Me" className="user-avatar" style={{ width: '40px', height: '40px' }} />
                            <div className="d-flex flex-column justify-content-center mt-1 ms-2">
                                <div className="user-name lh-1" style={{ fontSize: '1rem' }}>{userName}</div>
                                <div className="progress-bg" style={{ width: '100px' }}>
                                    <div className="progress-fill" style={{ width: `${calculateProfileCompletion()}%`, transition: 'width 0.5s ease-in-out' }}></div>
                                </div>
                                <div className="completion-text mt-1" style={{ fontSize: '0.75rem', opacity: '0.9', color: 'white' }}>
                                    {calculateProfileCompletion()}% Complete
                                </div>

                            </div>
                        </div>
                    )}

                    {!isCollapsed && (
                        <div className="d-flex gap-2">
                            <i className="fa-solid fa-shield-halved text-white-50 chat-icon" title="Safety Center" style={{ cursor: 'pointer', fontSize: '1.2rem' }}></i>
                            <i className="fa-solid fa-xmark d-md-none text-white fs-4" style={{ cursor: 'pointer' }} onClick={() => setIsSidebarMobileOpen(false)}></i>
                        </div>
                    )}
                </div>

                {/* 👇 NAYA: Professional Search Bar 👇 */}
                {!isCollapsed && (
                    <div className="search-container p-3" style={{ background: 'white', borderBottom: '1px solid #e0e0e0' }}>
                        <div className="search-box">
                            <i className="fa-solid fa-magnifying-glass search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search matches..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="sidebar-tabs">
                    <div className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>Matches</div>
                    <div className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>Messages</div>
                </div>

                {/* Tab Content */}
                <div className="sidebar-content">
                    {activeTab === 'matches' ? (
                        <div>
                            {/* --- DYNAMIC NEW MATCHES --- */}
                            <div className="p-3 pb-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>New Matches</div>

                            {sidebarData.matches.length === 0 && (
                                <div className="p-3 text-muted small">No matches yet. Keep swiping!</div>
                            )}

                            {/* Yahan par .filter add kiya gaya hai */}
                            {sidebarData.matches
                                .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(match => (
                                    <div key={`match-${match.id}`} className="list-item" onClick={() => openChat(match.id, match.name, match.photo)} style={{ cursor: 'pointer' }}>
                                        <div className="list-avatar-box">
                                            <img src={match.photo} className="list-avatar" style={{ border: '2px solid #17e27a' }} />
                                            <div className="badge-icon" style={{ backgroundColor: '#17e27a' }}><i className="fa-solid fa-heart"></i></div>
                                        </div>
                                        <div className="list-info">
                                            <div className="list-name">{match.name}</div>
                                            <div className="list-msg text-success fw-bold">It's a Match! Say Hi 👋</div>
                                        </div>
                                    </div>
                                ))}

                            {/* --- DYNAMIC LIKED YOU --- */}
                            <div className="p-3 pb-0 text-muted small fw-bold text-uppercase mt-2" style={{ letterSpacing: '1px', borderTop: '1px solid #eee' }}>Liked You</div>

                            {sidebarData.liked_you.map(person => (
                                <div
                                    key={`liked-${person.id}`}
                                    className="list-item"
                                    style={{ cursor: 'pointer' }}
                                    // 👇 NAYA: Agar VIP NAHI hai, tabhi Premium Modal khulega
                                    onClick={() => {
                                        if (isPremium) {
                                            // 1. Is profile ko 'Select' karo taaki details dikhe
                                            setSelectedLikedProfile(person);
                                            // 2. Dashboard ko 'Discovery' panel par le jao jahan bada card dikhta hai
                                            setActivePanel('discovery');
                                        } else {
                                            // Agar VIP nahi hai toh modal dikhao
                                            setShowPremiumModal(true);
                                        }
                                    }}                           >
                                    <div className="list-avatar-box">
                                        <img
                                            src={person.photo}
                                            className="list-avatar"
                                            style={{
                                                // 👇 ASLI JAADU: Agar premium hai toh 'none' (saaf), warna 'blur'
                                                filter: isPremium ? 'none' : 'blur(5px)',
                                                border: person.is_superlike ? '2px solid #2196f3' : '2px solid #fd5c63'
                                            }}
                                        />
                                        <div className="badge-icon" style={{ backgroundColor: person.is_superlike ? '#2196f3' : '#fd5c63' }}>
                                            {person.is_superlike ? <i className="fa-solid fa-star"></i> : <i className="fa-solid fa-heart"></i>}
                                        </div>
                                    </div>
                                    <div className="list-info">
                                        {/* 👇 NAYA: Premium hai toh asli naam dikhao, warna 'Someone' */}
                                        <div className="list-name">
                                            {isPremium ? person.name : 'Someone'}
                                        </div>

                                        <div className={`list-msg fw-bold ${person.is_superlike ? 'text-primary' : 'text-danger'}`}>
                                            {person.is_superlike ? 'Super Liked you! Tap to view.' : 'Liked you. Tap to view.'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    ) : (
                        // --- DYNAMIC MESSAGES TAB ---
                        <div>
                            {activeChatList.length === 0 ? (
                                <div className="p-3 text-muted small text-center mt-4">
                                    <i className="fa-regular fa-comments fs-1 mb-2 opacity-50"></i>
                                    <p>Your active chats will appear here.</p>
                                </div>
                            ) : (
                                activeChatList.map((chat) => {
                                    const isMe = chat.sender_id == localStorage.getItem('user_id');
                                    return (
                                        <div key={`chatlist-${chat.other_user_id}`} className="list-item" onClick={() => openChat(chat.other_user_id, chat.name, chat.photo)} style={{ cursor: 'pointer' }}>
                                            <div className="list-avatar-box">
                                                <img src={chat.photo} className="list-avatar" alt="Profile" />
                                            </div>
                                            <div className="list-info" style={{ width: '100%', overflow: 'hidden' }}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="list-name fw-bold text-dark">{chat.name}</div>
                                                    <div className={`text-muted ${chat.unread_count > 0 ? 'text-success fw-bold' : ''}`} style={{ fontSize: '0.65rem' }}>
                                                        {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center mt-1">
                                                    <div className="list-msg text-muted text-truncate" style={{ fontSize: '0.8rem', maxWidth: '160px', fontWeight: chat.unread_count > 0 ? '600' : 'normal' }}>
                                                        {/* Blue Ticks Logic: Agar is_read true hai toh blue (text-info), warna grey */}
                                                        {isMe && (
                                                            <i className={`fa-solid fa-check-double me-1 ${chat.is_read ? 'text-info' : 'text-secondary'}`} style={{ fontSize: '0.7rem' }}></i>
                                                        )}
                                                        {chat.last_message}
                                                    </div>

                                                    {/* WhatsApp jaisa Green Badge (Unread Count) */}
                                                    {chat.unread_count > 0 && (
                                                        <div className="badge rounded-circle" style={{ backgroundColor: '#17e27a', fontSize: '0.65rem', padding: '4px 6px' }}>
                                                            {chat.unread_count}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
                {/* 👇 NAYA SIDEBAR FOOTER (Settings & Logout) 👇 */}
                <div className="sidebar-footer" style={{ padding: '15px 25px', borderTop: '1px solid #e0e0e0', marginTop: 'auto' }}>

                    {/* Settings Option */}
                    <div className="d-flex align-items-center gap-3 text-muted mb-3" style={{ cursor: 'pointer' }} onClick={() => { setShowSettingsModal(true); fetchBlockedUsers(); }}>
                        <i className="fa-solid fa-gear fs-5"></i>
                        <span className="fw-bold">Settings & Help</span>
                    </div>

                    {/* Log Out Option */}
                    <div className="d-flex align-items-center gap-3 text-danger" style={{ cursor: 'pointer' }} onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket fs-5"></i>
                        <span className="fw-bold">Log out</span>
                    </div>

                </div>
                {/* 👆 NAYA CODE YAHAN KHATAM 👆 */}
            </aside>

            {/* =========================================
          MAIN DISCOVERY AREA (Swipe Cards & Panels)
      ========================================= */}
            <main className="main-area">

                {/* --- 1. DISCOVERY VIEW (Swipe Cards) --- */}
                {activePanel === 'discovery' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Top Navbar with Mobile Hamburger */}
                        <div className="top-navbar" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* 👇 NAYA: Mobile Hamburger Menu 👇 */}
                            <div className="d-md-none" onClick={() => setIsSidebarMobileOpen(true)} style={{ cursor: 'pointer' }}>
                                <i className="fa-solid fa-bars fs-2" style={{ padding: '10px', color: 'var(--primary-color)' }}></i>
                            </div>

                            {/* Right Side Buttons (Dark Mode & Filter) */}
                            <div className="d-flex gap-3 ms-auto">
                                <div className="filter-btn theme-toggle-btn" title="Toggle Theme" onClick={() => setIsDarkMode(!isDarkMode)}>
                                    {isDarkMode ? <i className="fa-solid fa-sun" style={{ color: '#f5b748' }}></i> : <i className="fa-solid fa-moon"></i>}
                                </div>
                                <div className="filter-btn" title="Discovery Preferences" onClick={() => setIsFilterOpen(true)}>
                                    <i className="fa-solid fa-sliders"></i>
                                </div>
                            </div>
                        </div>

                        <div className="card-container" style={{ position: 'relative' }}>
                            {/* 👇 NAYA: PREVIOUS PROFILE BUTTON (Bahar ki taraf) 👇 */}
                            {profiles.length > 1 && !loadingProfiles && currentProfile && (
                                <div className="profile-skip-box skip-left" onClick={skipToPrevProfile}>
                                    {/* Text ab button se pehle aayega */}
                                    <span className="skip-text">PREVIOUS</span>
                                    <div className="profile-skip-btn">
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </div>
                                </div>
                            )}
                            {loadingProfiles ? (
                                <div className="text-muted text-center mt-5">
                                    <div className="spinner-border text-primary mb-3" role="status"></div>
                                    <h5>Finding people near you...</h5>
                                </div>
                            ) : (selectedLikedProfile || (profiles.length > 0 && currentProfile)) ? (
                                <motion.div
                                    key={selectedLikedProfile ? `liked-${selectedLikedProfile.id}` : currentProfile.id}
                                    className={`profile-card ${swipeDirection ? swipeDirection : ''}`}
                                    style={{ x, rotate, opacity }}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragDirectionLock={true}
                                    onDragEnd={handleDragEnd}
                                    whileDrag={{ scale: 1.05 }}
                                >
                                    <div className="photo-wrapper">
                                        {/* Agar selected profile nahi hai (normal discovery hai), tabhi story bars dikhao */}
                                        {!selectedLikedProfile && (
                                            <div className="story-bars">
                                                {currentProfile.photos.map((_, i) => (
                                                    <div key={i} className={`story-bar ${i <= photoIndex ? 'active' : ''}`}></div>
                                                ))}
                                            </div>
                                        )}

                                        <img
                                            src={selectedLikedProfile ? selectedLikedProfile.photo : currentProfile.photos[photoIndex]}
                                            className="main-photo"
                                            alt="Profile"
                                            draggable="false"
                                        />

                                        {/* Agar normal discovery hai tabhi tap to next photo chalega */}
                                        {!selectedLikedProfile && (
                                            <>
                                                <div className="tap-left" onClick={() => handlePhotoTap(-1)}><i className="fa-solid fa-chevron-left"></i></div>
                                                <div className="tap-right" onClick={() => handlePhotoTap(1)}><i className="fa-solid fa-chevron-right"></i></div>
                                            </>
                                        )}
                                    </div>

                                    <div className="card-info">
                                        <h1 className="profile-name">
                                            {selectedLikedProfile ? selectedLikedProfile.name : currentProfile.name}
                                            {/* Age aur tick sirf tab dikhao jab normal discovery ho */}
                                            {!selectedLikedProfile && `, ${currentProfile.age}`}
                                            {!selectedLikedProfile && currentProfile.verified && <i className="fa-solid fa-circle-check verified-badge"></i>}
                                        </h1>

                                        {/* Agar normal discovery hai toh puri details dikhao */}
                                        {!selectedLikedProfile ? (
                                            <>
                                                <div className="profile-basic">
                                                    <span><i className="fa-solid fa-location-dot me-2"></i> {currentProfile.city}</span>
                                                    <span><i className="fa-solid fa-briefcase me-2"></i> {currentProfile.job}</span>
                                                </div>
                                                <div className="pill-container">
                                                    <div className="info-pill intent-pill">{currentProfile.intent}</div>
                                                    <div className="info-pill">{currentProfile.drinking}</div>
                                                </div>
                                                <div className="bio-box mt-4">
                                                    <div className="bio-title">My Bio</div>
                                                    <div className="bio-text">"{currentProfile.bio}"</div>
                                                </div>
                                                <h6 className="text-muted small fw-bold mb-2 mt-4">Interests</h6>
                                                <div className="pill-container">
                                                    {currentProfile.interests.map(interest => (
                                                        <div key={interest} className="info-pill">{interest}</div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            // Agar 'Liked You' se aaye hain toh sirf ek pyara sa message dikhao
                                            <div className="bio-box mt-4">
                                                <div className="bio-title">Secret Admirer ✨</div>
                                                <div className="bio-text">
                                                    "I liked your profile! Swipe right to match and let's start talking."
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center text-muted mt-5">
                                    <div className="fs-1 mb-3">👻</div>
                                    <h4>No new profiles around you!</h4>
                                    <p>Try changing your filters or come back later.</p>
                                </div>
                            )}

                            {/* 👇 NAYA: NEXT PROFILE BUTTON (Bahar ki taraf) 👇 */}
                            {profiles.length > 1 && !loadingProfiles && currentProfile && (
                                <div className="profile-skip-box skip-right" onClick={skipToNextProfile}>
                                    {/* Text ab button se pehle aayega */}
                                    <span className="skip-text">NEXT</span>
                                    <div className="profile-skip-btn">
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="action-bar">
                            <button className="btn-action btn-rewind"><i className="fa-solid fa-rotate-left"></i></button>
                            <button className="btn-action btn-pass" onClick={() => handleSwipe('left')}><i className="fa-solid fa-xmark"></i></button>
                            <button className="btn-action btn-super" onClick={celebrateMatch}><i className="fa-solid fa-star"></i></button>
                            <button className="btn-action btn-like" onClick={() => handleSwipe('right')}><i className="fa-solid fa-heart"></i></button>
                            <button className="btn-action btn-msg"><i className="fa-solid fa-comment-dots"></i></button>
                        </div>
                    </div>
                )}

                {/* --- 2. MY PROFILE PANEL (Edit Profile) --- */}
                {activePanel === 'profile' && (
                    <div className="my-profile-panel">

                        {/* Premium Header (Fixed overlap issue) */}
                        <div className="panel-header">
                            <div className="close-panel-btn" onClick={closeSidePanel} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', background: '#f0f2f5' }}>
                                <i className="fa-solid fa-chevron-left"></i>
                            </div>
                            <h3 className="font-heading fw-bold m-0 text-center flex-grow-1">Edit Profile</h3>
                            <div style={{ width: '40px' }}></div> {/* Spacer to keep title perfectly centered */}
                        </div>

                        <div className="details-section">

                            {/* Premium Profile Picture Upload */}
                            <div className="dp-container text-center mt-4">
                                <div className="dp-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                                    <img src={mainDp} className="profile-dp" style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary-color)', objectFit: 'cover' }} alt="DP" />
                                    <label className="edit-dp-btn" title="Change Profile Photo" style={{ cursor: 'pointer' }}>
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMainDpUpload} />
                                        <i className="fa-solid fa-camera"></i>
                                    </label>
                                </div>
                                <h4 className="font-heading fw-bold mt-3">{userName}</h4>
                            </div>

                            {/* Photos Grid (Working Logic) */}
                            <h5 className="font-heading fw-bold mt-4">My Photos</h5>
                            <p className="text-muted small">Add up to 6 photos to complete your profile.</p>
                            <div className="edit-photo-grid">
                                {editPhotos.map((photoUrl, index) => (
                                    <label key={index} className="edit-photo-slot" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleEditPhotoUpload(e, index)}
                                        />
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                                        ) : (
                                            <i className="fa-solid fa-plus text-muted fs-4"></i>
                                        )}
                                    </label>
                                ))}
                            </div>

                            {/* Basics Info */}
                            <div className="form-floating mb-3 mt-4">
                                <input
                                    type="text"
                                    className="form-control border-0 border-bottom rounded-0 shadow-none"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                                <label>First Name</label>
                            </div>
                            {/* Last Name */}
                            <div className="form-floating mb-3">
                                <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                                <label>Last Name</label>
                            </div>

                            {/* Date of Birth */}
                            <div className="form-floating mb-3">
                                <input type="date" className="form-control border-0 border-bottom rounded-0 shadow-none" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                                <label>Birthday 🎂</label>
                            </div>

                            {/* Mobile No (Read Only - kyunki ye login ID hai) */}
                            <div className="form-floating mb-3">
                                <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none bg-light" value={userMobile} readOnly />
                                <label>Mobile Number (Registered)</label>
                            </div>
                            {/* City Input */}
                            <div className="form-floating mb-4">
                                <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                                <label><i className="fa-solid fa-location-dot me-1"></i> City / Neighborhood</label>
                            </div>

                            {/* Drinking Dropdown */}
                            <div className="mb-4">
                                <div className="form-floating">
                                    <select className="form-select border-0 border-bottom rounded-0 shadow-none" value={editDrinking} onChange={(e) => setEditDrinking(e.target.value)}>
                                        <option value="" disabled>Select Drinking Habit</option>
                                        <option>Socially 🍻</option>
                                        <option>Never 🚫</option>
                                        <option>Frequently 🍷</option>
                                        <option>Planning to quit 🛑</option>
                                    </select>
                                    <label>Drinking 🥂</label>
                                </div>
                            </div>

                            {/* College Input */}
                            <div className="form-floating mb-3">
                                <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none" value={editCollege} onChange={(e) => setEditCollege(e.target.value)} />
                                <label>College / University 🎓</label>
                            </div>

                            {/* Job Title Input */}
                            <div className="form-floating mb-5">
                                <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none" value={editJob} onChange={(e) => setEditJob(e.target.value)} />
                                <label>Job Title 💼</label>
                            </div>

                            {/* Vibe & Intent Cards */}
                            <label className="text-muted small fw-bold mt-2">Relationship intent</label>
                            <div className="vibe-card mb-3" data-bs-toggle="modal" data-bs-target="#dashboardIntentModal">
                                <div className="d-flex align-items-center gap-3">
                                    <span style={{ fontSize: '1.5rem' }}>{editIntent.icon}</span>
                                    <div><strong>{editIntent.text}</strong></div>
                                </div>
                                <i className="fa-solid fa-pencil text-muted small"></i>
                            </div>

                            <label className="text-muted small fw-bold mt-2">My interests</label>
                            <div className="vibe-card mb-4" data-bs-toggle="modal" data-bs-target="#dashboardInterestsModal">
                                {/* Ab yeh saare selected tags ko bina hide kiye dikhayega */}
                                <div className="d-flex flex-wrap gap-2">
                                    {editInterests.map(tag => (
                                        <div key={tag} className="selected-pill">{tag}</div>
                                    ))}
                                </div>
                                <i className="fa-solid fa-pencil text-muted small"></i>
                            </div>

                            {/* Bio Section with AI Generator */}
                            <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                                <label className="form-label text-muted small fw-bold m-0">My Bio</label>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'linear-gradient(45deg, #FF6B6B, #9B51E0)', color: 'white', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                    onClick={generateSmartBio}
                                >
                                    <i className="fa-solid fa-wand-magic-sparkles me-1"></i> Generate AI Bio
                                </button>
                            </div>
                            <textarea
                                className="form-control"
                                rows="4"
                                style={{ resize: 'none', borderRadius: '12px', border: '2px solid #e0e0e0', padding: '15px', color: 'var(--primary-color)', fontSize: '1.1rem' }}
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                            ></textarea>


                            <div className="text-center mt-5 mb-5">
                                <button
                                    className="btn-dark-solid btn-lg w-100 py-3"
                                    style={{ borderRadius: '30px' }}
                                    onClick={handleSaveChanges}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 3. CHAT PANEL --- */}
                {activePanel === 'chat' && chatData && (
                    <div className="chat-panel" style={{ display: 'flex', width: '100%', height: '100%' }}>
                        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '15px 30px', background: 'white', borderBottom: '1px solid #e0e0e0' }}>

                            {/* Left Side: Back Btn + Avatar + Name */}
                            <div className="d-flex align-items-center gap-3">
                                <div className="close-panel-btn" onClick={closeSidePanel} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', background: '#f0f2f5' }}>
                                    <i className="fa-solid fa-chevron-left"></i>
                                </div>
                                <img src={chatData.avatar} className="chat-header-avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="Profile" />

                                <div>
                                    <div className="chat-name mb-0 fw-bold">{chatData.name}</div>

                                    {/* 👇 NAYA: Yahan se purana 'Online' hata diya hai aur sirf dynamic wala rakha hai */}
                                    <div className={`chat-status small fw-bold ${isOtherUserTyping ? 'text-success' : 'text-muted'}`}>
                                        {isOtherUserTyping ? "Typing..." : (isOtherUserOnline ? "Online" : "Offline")}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Call Icons & 3-dot Menu */}
                            <div className="d-flex align-items-center gap-4">
                                <i className="fa-solid fa-video chat-icon text-primary fs-5" style={{ cursor: 'pointer' }} onClick={startVideoCall}></i>
                                <i className="fa-solid fa-phone chat-icon text-primary fs-5" style={{ cursor: 'pointer' }} onClick={startAudioCall}></i>

                                {/* WhatsApp jaisa 3-Dot Menu */}
                                <div className="dropdown">
                                    <i className="fa-solid fa-ellipsis-vertical chat-icon text-muted fs-5" style={{ cursor: 'pointer' }} data-bs-toggle="dropdown"></i>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: '10px' }}>

                                        {/* 👇 NAYA: Block User Button 👇 */}
                                        <li>
                                            <div className="dropdown-item text-danger fw-bold" style={{ cursor: 'pointer' }} onClick={handleBlockUser}>
                                                <i className="fa-solid fa-ban me-2"></i> Report & Block
                                            </div>
                                        </li>

                                        {/* Purana: Clear Chat Button */}
                                        <li>
                                            <div className="dropdown-item text-danger fw-bold" style={{ cursor: 'pointer' }} onClick={() => {
                                                if (window.confirm('Clear all messages from this chat?')) {
                                                    // Backend ko signal bhejo
                                                    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                                                        chatSocket.send(JSON.stringify({
                                                            type: 'clear_chat',
                                                            sender_id: localStorage.getItem('user_id'),
                                                            receiver_id: chatData.matchId
                                                        }));
                                                    }
                                                    // Screen se clear kardo
                                                    setChatMessages([]);
                                                }
                                            }}>
                                                <i className="fa-solid fa-trash me-2"></i> Clear Chat
                                            </div>
                                        </li>

                                    </ul>
                                </div>
                            </div>

                        </div>

                        {/* ASLI CHAT MESSAGES */}
                        <div className="chat-body flex-grow-1" style={{ padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', background: '#f0f2f5' }}>
                            <div className="text-center w-100"><span className="badge bg-secondary opacity-50 fw-normal">Today</span></div>
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-muted mt-5">No messages yet. Say Hi! 👋</div>
                            ) : (
                                (() => {
                                    // 👇 NAYA HACK: Saari lagatar photos ko ek hi 'Group' me pack karo
                                    const groupedMessages = [];
                                    let currentGroup = null;

                                    chatMessages.forEach((msg) => {
                                        const isImageOnly = msg.image_url && !msg.content;

                                        // Agar pichla message bhi photo tha aur same bande ne bheja hai, toh usi me jod do
                                        if (currentGroup && currentGroup.sender == msg.sender && isImageOnly && currentGroup.isImageGroup) {
                                            currentGroup.images.push(msg);
                                        } else {
                                            if (currentGroup) groupedMessages.push(currentGroup);
                                            currentGroup = {
                                                ...msg,
                                                isImageGroup: isImageOnly,
                                                images: isImageOnly ? [msg] : [] // Photos ka ek array bana liya
                                            };
                                        }
                                    });
                                    if (currentGroup) groupedMessages.push(currentGroup);

                                    // Ab har message ki jagah har 'Group' ka ek dabba banega
                                    // Ab har message ki jagah har 'Group' ka ek dabba banega
                                    return groupedMessages.map((group, index) => {
                                        const isMe = group.sender == localStorage.getItem('user_id');

                                        return (
                                            <div key={index} className={`chat-message-bubble ${isMe ? 'message-sent' : 'message-received'}`}
                                                onClick={() => setActiveMsgId(activeMsgId === group.id ? null : group.id)} // 👈 Click par popup khulega
                                                style={{
                                                    background: isMe ? '#d9fdd3' : 'white',
                                                    padding: group.isImageGroup ? '4px' : '10px 15px',
                                                    borderRadius: '15px',
                                                    borderTopRightRadius: isMe ? '0' : '15px',
                                                    borderTopLeftRadius: isMe ? '15px' : '0',
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '285px',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '4px',
                                                    justifyContent: 'flex-start',
                                                    marginBottom: '15px',
                                                    cursor: 'pointer'
                                                }}>

                                                {/* 👇 NAYA: Pro Popup Menu (Reactions & Delete) */}
                                                {activeMsgId === group.id && !group.is_deleted && (
                                                    <div style={{
                                                        position: 'absolute', top: '-65px',
                                                        right: isMe ? '0' : 'auto', left: isMe ? 'auto' : '0',
                                                        background: 'white', borderRadius: '12px', padding: '10px',
                                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '180px'
                                                    }}>

                                                        {/* 6 Emojis Line */}
                                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                                                            {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
                                                                <span key={emoji} style={{ cursor: 'pointer', fontSize: '1.3rem', transition: 'transform 0.1s' }}
                                                                    onClick={(e) => { e.stopPropagation(); handleReact(group.id, emoji); }}
                                                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                                >
                                                                    {emoji}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Delete for everyone option */}
                                                        {isMe && (
                                                            <div style={{
                                                                cursor: 'pointer', color: '#fd5c63', fontSize: '0.9rem',
                                                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px'
                                                            }} onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}>
                                                                <i className="fa-solid fa-trash-can"></i> Delete for everyone
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 👇 NAYA: Agar message delete ho gaya hai toh kya dikhega */}
                                                {group.is_deleted ? (
                                                    <div className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.9rem', width: '100%', padding: '5px' }}>
                                                        <i className="fa-solid fa-ban me-1"></i> This message was deleted
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Agar is group me sirf photos hain */}
                                                        {group.isImageGroup ? (
                                                            group.images.map((imgMsg, imgIndex) => {
                                                                const imgSize = group.images.length > 1 ? '135px' : '260px';
                                                                return (
                                                                    <div key={imgIndex} style={{ position: 'relative' }}>
                                                                        <img
                                                                            src={`http://127.0.0.1:8000${imgMsg.image_url}`}
                                                                            alt="Sent file"
                                                                            onClick={(e) => { e.stopPropagation(); setZoomImage(imgMsg.image_url); }}
                                                                            style={{ width: imgSize, height: imgSize, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                                                                        />
                                                                        {imgIndex === group.images.length - 1 && (
                                                                            <span className="message-time text-muted" style={{ fontSize: '0.65rem', position: 'absolute', bottom: '6px', right: '8px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px' }}>
                                                                                {new Date(imgMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                {isMe && <i className={`ms-1 fa-solid ${imgMsg.is_read ? 'fa-check-double text-info' : 'fa-check'}`} style={{ fontSize: '0.65rem', color: !imgMsg.is_read ? '#fff' : '' }}></i>}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            /* Normal Text ya Text+Image */
                                                            <>
                                                                {group.image_url && <img src={`http://127.0.0.1:8000${group.image_url}`} alt="Sent file" onClick={(e) => { e.stopPropagation(); setZoomImage(group.image_url); }} style={{ width: '260px', height: '280px', objectFit: 'cover', borderRadius: '8px', marginBottom: '5px', display: 'block' }} />}
                                                                {group.content && <span style={{ width: '100%', marginTop: '5px' }}>{group.content}</span>}
                                                                <span className="message-time text-muted" style={{ fontSize: '0.65rem', marginTop: group.content ? '4px' : '0', marginLeft: 'auto' }}>
                                                                    {new Date(group.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && <i className={`ms-1 fa-solid ${group.is_read ? 'fa-check-double text-info' : 'fa-check text-secondary'}`} style={{ fontSize: '0.65rem' }}></i>}
                                                                </span>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {/* 👇 NAYA: Message ke neeche reaction dikhana */}
                                                {group.reaction && !group.is_deleted && (
                                                    <div style={{ position: 'absolute', bottom: '-10px', right: isMe ? '15px' : 'auto', left: isMe ? 'auto' : '15px', background: 'white', border: '1px solid #ddd', borderRadius: '50%', padding: '2px 5px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                        {group.reaction}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });


                                })()
                            )}

                        </div>
                        {/* Multi-Image Preview UI */}
                        {selectedImages.length > 0 && (
                            <div style={{ padding: '10px 30px', background: '#f0f2f5', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {selectedImages.map((file, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #2196f3' }}
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#fd5c63', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            ✖
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* SEND MESSAGE BAR */}
                        <div className="chat-input-bar" style={{ padding: '15px 30px', background: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>

                            {/* 👇 NAYA: Hidden Input */}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            {/* Emoji Picker Button & Container */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <i
                                    className="fa-regular fa-face-smile text-muted fs-4"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                ></i>

                                {/* 👇 WhatsApp Jaisa Emoji Box Popup 👇 */}
                                {showEmojiPicker && (
                                    <div style={{ position: 'absolute', bottom: '50px', left: '0', zIndex: 1000 }}>
                                        <EmojiPicker
                                            onEmojiClick={(emojiObject) => {
                                                // Emoji select hote hi text box mein add ho jayega
                                                setNewMessageText((prevText) => prevText + emojiObject.emoji);
                                                // Select karne ke baad dabba band karna hai toh niche wali line rakhein
                                                // setShowEmojiPicker(false); 
                                            }}
                                            theme={isDarkMode ? "dark" : "light"}
                                            previewConfig={{ showPreview: false }}
                                            width={300}
                                            height={400}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 👇 NAYA: Attach (Paperclip) Icon */}
                            <i className="fa-solid fa-paperclip text-muted fs-4" style={{ cursor: 'pointer' }} onClick={handleAttachClick}></i>

                            <input
                                type="text"
                                className="form-control rounded-pill"
                                // 👇 NAYA: Yahan se wo ganda text hata diya aur hamesha yahi dikhega 👇
                                placeholder="Type a message..."
                                style={{ background: '#f0f2f5', border: 'none', padding: '10px 20px', flex: 1 }}
                                value={newMessageText}
                                onChange={(e) => {
                                    setNewMessageText(e.target.value);
                                    // Typing Signal...
                                    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                                        chatSocket.send(JSON.stringify({ type: 'typing', is_typing: true, sender_id: localStorage.getItem('user_id') }));
                                        clearTimeout(window.typingTimeout);
                                        window.typingTimeout = setTimeout(() => {
                                            chatSocket.send(JSON.stringify({ type: 'typing', is_typing: false, sender_id: localStorage.getItem('user_id') }));
                                        }, 1500);
                                    }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <i className="fa-solid fa-paper-plane text-primary fs-4" style={{ cursor: 'pointer' }} onClick={handleSendMessage}></i>
                        </div>
                    </div>
                )}

            </main>
            {/* =========================================
          MODALS FOR DASHBOARD
      ========================================= */}
            <div className="modal fade" id="dashboardIntentModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content p-4 rounded-5 border-0 shadow">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-heading fw-bold w-100 text-center">Looking for?</h5>
                            <button type="button" className="btn-close position-absolute end-0 me-4" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body text-center p-4">
                            <div className="row g-2">
                                {[
                                    { icon: '💘', text: 'Long-term partner' },
                                    { icon: '🥂', text: 'Short-term fun' },
                                    { icon: '👋', text: 'New friends' },
                                    { icon: '🤔', text: 'Still figuring it out' }
                                ].map(item => (
                                    <div key={item.text} className="col-6" onClick={() => setEditIntent(item)}>
                                        <div className={`intent-card-premium ${editIntent.text === item.text ? 'active' : ''}`}>
                                            <div className="fs-1 mb-1">{item.icon}</div>
                                            <div className="fw-bold small">{item.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button type="button" className="btn btn-dark-solid w-100 py-3 rounded-pill" data-bs-dismiss="modal">Save Intent</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="dashboardInterestsModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content p-4 rounded-5 border-0 shadow">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-heading fw-bold w-100 text-center">What are you into?</h5>
                            <button type="button" className="btn-close position-absolute end-0 me-4" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body text-center p-4">
                            <p className="text-muted small mb-4">{editInterests.length}/7 selected</p>
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
                                        className={`pill-btn-premium ${editInterests.includes(tag) ? 'active' : ''}`}
                                        onClick={() => {
                                            if (editInterests.includes(tag)) {
                                                setEditInterests(editInterests.filter(i => i !== tag));
                                            } else if (editInterests.length < 7) {
                                                setEditInterests([...editInterests, tag]);
                                            }
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0 mt-4">
                            <button type="button" className="btn btn-dark-solid w-100 py-3 rounded-pill" data-bs-dismiss="modal">Save Interests</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================
          PREFERENCES (FILTER PANEL)
      ========================================= */}
            <div className={`filter-panel ${isFilterOpen ? 'open' : ''}`}>
                <div className="filter-header">
                    <h2 className="font-heading fw-bold mb-0">Preferences</h2>
                    <i className="fa-solid fa-xmark close-filter" onClick={() => setIsFilterOpen(false)}></i>
                </div>

                <label className="filter-label mt-2">Distance Range <span className="live-val">{distance} km</span></label>
                <input type="range" className="custom-range" min="1" max="100" value={distance} onChange={(e) => setDistance(e.target.value)} />
                <div className="range-labels"><span>1 km</span><span>Up to 100 km</span></div>

                <label className="filter-label">Age Range <span className="live-val">{age}</span></label>
                <input type="range" className="custom-range" min="18" max="60" value={age} onChange={(e) => setAge(e.target.value)} />
                <div className="range-labels"><span>18</span><span>60+</span></div>

                <label className="filter-label">Show me</label>
                <select className="filter-select mb-4" value={preferredGender} onChange={(e) => setPreferredGender(e.target.value)}>
                    <option>Women</option>
                    <option>Men</option>
                    <option>Everyone</option>
                </select>

                <button
                    className="btn-dark-solid w-100 py-3 mt-auto shadow-sm"
                    style={{ borderRadius: '12px', fontSize: '1.1rem' }}
                    onClick={() => {
                        setIsFilterOpen(false);
                        fetchDiscoveryProfiles(); // Naye filters ke sath data lao!
                    }}
                >
                    Apply Filters
                </button>
            </div>
{/* =========================================
                MATCH CELEBRATION OVERLAY
            ========================================= */}
            {showMatch && matchedProfile && (
                <div className="match-celebration">
                    <div className="match-title">It's a Match!</div>
                    <p className="text-white-50 mb-5 fs-5">Start your genuine connection now.</p>

                    <div className="match-avatars-container">
                        {/* Aapki DP */}
                        <img src={mainDp} alt="Me" className="match-celebration-avatar" />

                        {/* Heart Icon */}
                        <i className="fa-solid fa-heart match-celebration-heart"></i>

                        {/* 👇 FIX: Agar single photo hai toh wo lo, warna array ki pehli photo lo 👇 */}
                        <img 
                            src={matchedProfile.photo || matchedProfile.photos[0]} 
                            alt="Match" 
                            className="match-celebration-avatar" 
                        />
                    </div>

                    <button
                        className="btn btn-dark-solid btn-lg mb-4 text-white"
                        style={{ width: 'auto', padding: '15px 50px', backgroundColor: '#fd5c63', border: 'none' }}
                        onClick={() => {
                            closeCelebration();
                            // 👇 FIX: Yahan bhi same logic lagana hoga chat open karne ke liye 👇
                            openChat(
                                matchedProfile.id, 
                                matchedProfile.name, 
                                matchedProfile.photo || matchedProfile.photos[0]
                            );
                        }}
                    >
                        Send a Message
                    </button>

                    <div
                        className="text-white-50 mt-2 text-decoration-none fw-bold"
                        style={{ cursor: 'pointer', letterSpacing: '1px' }}
                        onClick={closeCelebration}
                    >
                        KEEP SWIPING
                    </div>
                </div>
            )}
            {/* =========================================
                VIP PREMIUM MODAL
            ========================================= */}
            {showPremiumModal && (
                <PremiumModal
                    onClose={() => setShowPremiumModal(false)}
                    onPay={handlePayment}
                />
            )}

            {/* =========================================
                WEBRTC VIDEO CALL OVERLAY
            ========================================= */}
            {callStatus !== 'idle' && (
                <div className="video-call-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                    {/* Ringing State (Samne wala call kar raha hai) */}
                    {callStatus === 'ringing' && (
                        <div className="text-center text-white">
                            <img src={chatData?.avatar} style={{ width: '150px', height: '150px', borderRadius: '50%', marginBottom: '30px', animation: 'pulse 1.5s infinite', border: '4px solid #fff' }} alt="Caller" />
                            <h2 className="fw-bold">{chatData?.name}</h2>
                            <p className="text-white-50">Incoming Video Call...</p>
                            <div className="mt-5 d-flex gap-5 justify-content-center">
                                <button className="btn btn-danger rounded-circle shadow-lg" style={{ width: '70px', height: '70px', fontSize: '1.5rem' }} onClick={endVideoCall}><i className="fa-solid fa-phone-slash"></i></button>
                                <button className="btn btn-success rounded-circle shadow-lg" style={{ width: '70px', height: '70px', fontSize: '1.5rem' }} onClick={acceptCall}><i className="fa-solid fa-phone"></i></button>                            </div>
                        </div>
                    )}

                    {/* Calling / Connected State (Camera ya Audio chal raha hai) */}
                    {(callStatus === 'calling' || callStatus === 'connected') && (
                        <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '1000px', maxHeight: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                            {/* 👇 NAYA: In video tags ko hide karenge agar callType 'audio' hai (taaki aawaz aati rahe par box na dikhe) */}
                            <video ref={remoteVideoRef} autoPlay playsInline style={{ display: callType === 'video' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#111', borderRadius: '20px' }}></video>

                            <video ref={localVideoRef} autoPlay playsInline muted style={{ display: callType === 'video' ? 'block' : 'none', position: 'absolute', bottom: '40px', right: '40px', width: '180px', height: '240px', objectFit: 'cover', border: '4px solid white', borderRadius: '15px', backgroundColor: '#000', boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}></video>

                            {/* 👇 NAYA: WhatsApp jaisa Audio Call UI 👇 */}
                            {callType === 'audio' && (
                                <div className="text-center text-white" style={{ zIndex: 10 }}>
                                    <img src={chatData?.avatar} style={{ width: '180px', height: '180px', borderRadius: '50%', marginBottom: '25px', border: '4px solid #17e27a', boxShadow: '0 0 40px rgba(23, 226, 122, 0.4)' }} alt="Caller DP" />
                                    <h2 className="fw-bold fs-1 mb-2">{chatData?.name}</h2>
                                    <p className="text-white-50 fs-5">{callStatus === 'calling' ? 'Ringing...' : 'Connected 📞'}</p>
                                </div>
                            )}

                            {/* Call control buttons */}
                            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 20 }}>
                                {(callStatus === 'calling' && callType === 'video') && <div className="text-white fw-bold px-4 py-2 rounded-pill" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>Ringing...</div>}
                                <button className="btn btn-danger rounded-circle shadow-lg" style={{ width: '65px', height: '65px', fontSize: '1.5rem' }} onClick={() => endVideoCall(true)}><i className="fa-solid fa-phone-slash"></i></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* =========================================
    FULLSCREEN IMAGE ZOOM (WhatsApp Lightbox)
========================================= */}
            {zoomImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 99999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {/* Chokdi (Close) Button */}
                    <i className="fa-solid fa-xmark"
                        onClick={() => setZoomImage(null)} // 👈 Chokdi dabate hi band ho jayega
                        style={{ position: 'absolute', top: '25px', right: '35px', color: 'white', fontSize: '2.5rem', cursor: 'pointer' }}>
                    </i>

                    <img
                        src={`http://127.0.0.1:8000${zoomImage}`}
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '10px', objectFit: 'contain' }}
                        alt="Zoomed"
                    />
                </div>
            )}
            {/* =========================================
    SETTINGS MODAL (Unblock Users)
========================================= */}
            {showSettingsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '400px', maxWidth: '90%' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0 fw-bold">Settings</h4>
                            <i className="fa-solid fa-xmark fs-4" style={{ cursor: 'pointer' }} onClick={() => setShowSettingsModal(false)}></i>
                        </div>

                        <h6 className="text-danger fw-bold mb-3"><i className="fa-solid fa-user-lock me-2"></i> Blocked Users</h6>

                        {blockedUsers.length === 0 ? (
                            <p className="text-muted small">You haven't blocked anyone yet.</p>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {blockedUsers.map(user => (
                                    <div key={user.id} className="d-flex justify-content-between align-items-center p-2 border rounded">
                                        <div className="d-flex align-items-center gap-2">
                                            <img src={user.photo} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="Blocked" />
                                            <span className="fw-bold">{user.name}</span>
                                        </div>
                                        <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => handleUnblock(user.id)}>
                                            Unblock
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;