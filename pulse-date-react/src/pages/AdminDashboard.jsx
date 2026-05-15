import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ totalUsers: 0, activeVIPs: 0, totalMatches: 0, revenue: '₹0' });
    const [users, setUsers] = useState([]);
    const [engagementData, setEngagementData] = useState([]);
    const [swipeLogs, setSwipeLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    // UI states
    const [isCollapsed, setIsCollapsed] = useState(false); // To toggle sidebar collapse on desktop
    const [isMobileOpen, setIsMobileOpen] = useState(false); // To toggle sidebar on mobile

    // --- 1. FETCH FUNCTIONS (Outside useEffect) ---
    const fetchAdminData = async () => {
        try {
            const response = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin-data/');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setStats(data.stats);
                setEngagementData(data.graphData);
            }
        } catch (error) { console.error("Admin Data Error:", error); }
    };

    const fetchFinanceData = async () => {
        try {
            const res = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin/transactions/');
            if (res.ok) {
                const txData = await res.json();
                setTransactions(txData);
            }
        } catch (error) { console.error("Finance Error:", error); }
    };

    const fetchSwipeLogs = async () => {
        try {
            const logRes = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin/swipe-logs/');
            if (logRes.ok) {
                const logData = await logRes.json();
                setSwipeLogs(logData);
            }
        } catch (error) { console.error("Swipe Logs Error:", error); }
    };

    // --- 2. CLEAN useEffect HOOK ---
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([
                fetchAdminData(),
                fetchFinanceData(),
                fetchSwipeLogs()
            ]);
            setLoading(false);
        };

        loadAllData();
    }, []);

    // --- 3. LOGOUT FUNCTION ---
    const handleLogout = () => {
        window.location.href = '/';
    };

    // --- REAL DATABASE ACTIONS ---
    const toggleVIP = async (userId) => {
        try {
            const res = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin/toggle-vip/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            if (res.ok) {
                // 1. Update users list first (For badge change)
                setUsers(users.map(u => u.id === userId ? { ...u, is_premium: !u.is_premium } : u));

                // 👇 REAL-TIME UPDATE MAGIC 👇
                // 2. Fetch new finance data immediately
                await fetchFinanceData();

                // 3. Update Stats (Revenue/VIP Count) as well
                await fetchAdminData();

                console.log("Finance and Stats updated in real-time! 🚀");
            }
        } catch (error) { console.error("VIP Toggle Error:", error); }
    };

    const toggleVerify = async (userId) => {
        try {
            const res = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin/toggle-verify/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !u.is_verified } : u));

                // Refresh stats upon verification update
                fetchAdminData();
            }
        } catch (error) { console.error("Verify Toggle Error:", error); }
    };

    const toggleBlock = async (userId, isBanned) => {
        const actionText = isBanned ? "UNBLOCK" : "BLOCK";
        if (window.confirm(`Are you sure you want to ${actionText} this user?`)) {
            try {
                const res = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin/toggle-block/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                });
                if (res.ok) {
                    setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !u.is_banned } : u));
                }
            } catch (error) { console.error("Block Toggle Error:", error); }
        }
    };

    // --- DELETE USER LOGIC ---
    const deleteUser = async (userId, userName) => {
        const confirmDelete = window.confirm(`DANGER! ⚠️ Are you sure you want to permanently delete ${userName}? This will erase all their matches, messages, and photos. This CANNOT be undone!`);

        if (confirmDelete) {
            try {
                const res = await fetch('https://pulse-dating-app-4njq.onrender.com/api/admin/delete-user/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                });
                if (res.ok) {
                    alert(`${userName} has been permanently deleted.`);
                    setUsers(users.filter(u => u.id !== userId));

                    // Update stats and finance after successful deletion
                    fetchAdminData();
                    fetchFinanceData();
                } else {
                    alert("Failed to delete user.");
                }
            } catch (error) { console.error("Delete Toggle Error:", error); }
        }
    };

    return (
        <div className="admin-layout">
            {/* Added classes to control sidebar collapse state */}
            <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>

                {/* Hamburger icon moved to the far left, removed inline styling for CSS control */}
                <div className="admin-brand">
                    <div className="admin-menu-toggle d-none d-lg-flex" onClick={() => setIsCollapsed(!isCollapsed)}>
                        <i className="fa-solid fa-bars text-white"></i>
                    </div>

                    <img className="brand-logo" src="/pulseicon.jpeg" alt="Pulse Logo" />
                    <span className="admin-brand-text">Pulse Admin</span>

                    <i className="fa-solid fa-xmark d-lg-none ms-auto text-white" style={{ cursor: 'pointer' }} onClick={() => setIsMobileOpen(false)}></i>
                </div>

                {/* Wrapped text in <span> for hide functionality during collapse */}
                <div className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileOpen(false); }}>
                    <i className="fa-solid fa-chart-pie"></i> <span className="nav-text">Overview</span>
                </div>
                <div className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsMobileOpen(false); }}>
                    <i className="fa-solid fa-users"></i> <span className="nav-text">Manage Users</span>
                </div>
                <div className={`admin-nav-item ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => { setActiveTab('matches'); setIsMobileOpen(false); }}>
                    <i className="fa-solid fa-fire"></i> <span className="nav-text">Swipe Logs</span>
                </div>
                <div className={`admin-nav-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => { setActiveTab('finance'); setIsMobileOpen(false); }}>
                    <i className="fa-solid fa-wallet"></i> <span className="nav-text">Finance & VIP</span>
                </div>

                <div className="admin-nav-item admin-logout" onClick={handleLogout}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> <span className="nav-text">Exit Panel</span>
                </div>
            </aside>

            <main className="admin-main">
                <div className="admin-header">
                    <div className="d-flex align-items-center gap-3">

                        {/* Kept desktop toggle in the sidebar, this is only for mobile */}
                        <div
                            className="admin-menu-toggle d-lg-none"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <i className="fa-solid fa-bars fs-4 text-white"></i>
                        </div>

                        <h2>Admin Control Center</h2>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <span className="welcome-text" style={{ color: '#cbd5e1', fontWeight: '500', fontSize: '1.1rem' }}>Welcome, Chief 👑</span>
                        <img src="/pulseicon.jpeg" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f5b748' }} alt="Admin" />
                    </div>
                </div>

                {/* --- TAB 1: OVERVIEW --- */}
                {activeTab === 'dashboard' && (
                    <div className="fade-in">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><i className="fa-solid fa-users"></i></div>
                                <div className="stat-info"><p>Total Users</p><h3>{loading ? '...' : stats.totalUsers}</h3></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 183, 72, 0.1)', color: '#f5b748' }}><i className="fa-solid fa-crown"></i></div>
                                <div className="stat-info"><p>Active VIPs</p><h3>{loading ? '...' : stats.activeVIPs}</h3></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><i className="fa-solid fa-heart"></i></div>
                                <div className="stat-info"><p>Total Matches</p><h3>{loading ? '...' : stats.totalMatches}</h3></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><i className="fa-solid fa-indian-rupee-sign"></i></div>
                                <div className="stat-info"><p>Total Revenue</p><h3>{loading ? '...' : stats.revenue}</h3></div>
                            </div>
                            {/* DAU CARD */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><i className="fa-solid fa-chart-line"></i></div>
                                <div className="stat-info"><p>Daily Active</p><h3>{loading ? '...' : stats.dau}</h3></div>
                            </div>
                        </div>

                        <div className="chart-container mt-4" style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                            <h4 className="chart-title" style={{ color: '#f8fafc', fontWeight: '700', marginBottom: '20px', fontSize: '1.2rem' }}>Weekly Engagement Overview</h4>
                            <div style={{ width: '100%', height: '280px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={engagementData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSwipes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f5b748" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#f5b748" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                                        <Area type="monotone" dataKey="swipes" stroke="#f5b748" strokeWidth={3} fillOpacity={1} fill="url(#colorSwipes)" name="Total Swipes" />
                                        <Area type="monotone" dataKey="matches" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorMatches)" name="New Matches" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: MANAGE USERS --- */}
                {activeTab === 'users' && (
                    <div className="admin-table-container fade-in" style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#f8fafc', fontWeight: '700', marginBottom: '20px' }}>Real User Database</h4>
                        {loading ? (
                            <div className="text-center p-5 text-muted">Loading real users from Database...</div>
                        ) : (
                            <table className="admin-table" style={{ width: '100%', color: '#f8fafc' }}>
                                <thead>
                                    <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>User Profile</th>
                                        <th style={{ padding: '15px' }}>Age & Gender</th>
                                        <th style={{ padding: '15px' }}>Location</th>
                                        <th style={{ padding: '15px' }}>Subscription</th>
                                        <th style={{ padding: '15px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-4">No users found in database.</td></tr>
                                    ) : (
                                        users.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <img src={user.photo} alt={user.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #475569' }} />
                                                        <span className="fw-bold">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>{user.age} • {user.gender}</td>
                                                <td style={{ padding: '15px' }}>{user.city}</td>
                                                <td style={{ padding: '15px' }}>
                                                    {user.is_banned ? (
                                                        <span className="badge rounded-pill bg-danger" style={{ padding: '5px 12px' }}><i className="fa-solid fa-ban me-1"></i> Banned</span>
                                                    ) : user.is_premium ? (
                                                        <span className="badge rounded-pill" style={{ background: 'linear-gradient(45deg, #f5b748, #f59e0b)', color: 'black', padding: '5px 12px' }}><i className="fa-solid fa-star me-1"></i> VIP</span>
                                                    ) : (
                                                        <span className="badge rounded-pill" style={{ backgroundColor: '#334155', color: '#cbd5e1', padding: '5px 12px' }}>Free User</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}></div>
                                                    <button
                                                        className="btn btn-sm me-2"
                                                        style={{ backgroundColor: user.is_premium ? 'transparent' : 'rgba(245, 183, 72, 0.1)', color: '#f5b748', border: '1px solid #f5b748' }}
                                                        title={user.is_premium ? "Remove VIP" : "Grant VIP"}
                                                        onClick={() => toggleVIP(user.id)}
                                                    >
                                                        <i className="fa-solid fa-crown"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm me-2"
                                                        style={{ backgroundColor: user.is_verified ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: '#3b82f6', border: '1px solid #3b82f6' }}
                                                        title={user.is_verified ? "Remove Verification" : "Verify User"}
                                                        onClick={() => toggleVerify(user.id)}
                                                    >
                                                        {user.is_verified ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-regular fa-circle-check"></i>}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            backgroundColor: user.is_banned ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: user.is_banned ? '#22c55e' : '#ef4444',
                                                            border: user.is_banned ? '1px solid #22c55e' : '1px solid #ef4444'
                                                        }}
                                                        title={user.is_banned ? "Unblock User" : "Block User"}
                                                        onClick={() => toggleBlock(user.id, user.is_banned)}
                                                    >
                                                        {user.is_banned ? <i className="fa-solid fa-unlock"></i> : <i className="fa-solid fa-ban"></i>}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            border: '1px solid #ef4444',
                                                            marginLeft: '5px' // To provide some spacing
                                                        }}
                                                        title="Delete User Permanently"
                                                        onClick={() => deleteUser(user.id, user.name)}
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* --- TAB 3: FINANCE LOGS --- */}
                {activeTab === 'finance' && (
                    <div className="admin-table-container fade-in">
                        <h4 style={{ color: '#f8fafc', fontWeight: '700', marginBottom: '20px' }}>VIP Transaction Logs</h4>
                        <table className="admin-table" style={{ width: '100%', color: '#f8fafc' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>User Name</th>
                                    <th style={{ padding: '15px' }}>Amount Paid</th>
                                    <th style={{ padding: '15px' }}>Plan Duration</th>
                                    <th style={{ padding: '15px' }}>Purchase Date</th>
                                    <th style={{ padding: '15px' }}>Expiry Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '15px', fontWeight: '600' }}>{tx.user_name}</td>
                                        <td style={{ padding: '15px', color: '#22c55e', fontWeight: 'bold' }}>₹{tx.amount}</td>
                                        <td style={{ padding: '15px' }}><span className="vip-badge">{tx.plan}</span></td>
                                        <td style={{ padding: '15px' }}>{tx.date}</td>
                                        <td style={{ padding: '15px', color: '#f5b748' }}>{tx.expiry}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- TAB 4: SWIPE LOGS --- */}
                {activeTab === 'matches' && (
                    <div className="admin-table-container fade-in" style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#f8fafc', fontWeight: '700', marginBottom: '20px' }}>Live Activity Stream</h4>
                        <table className="admin-table" style={{ width: '100%', color: '#f8fafc' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>User (Swiper)</th>
                                    <th style={{ padding: '15px' }}>Action</th>
                                    <th style={{ padding: '15px' }}>Target Profile</th>
                                    <th style={{ padding: '15px' }}>Match Status</th>
                                    <th style={{ padding: '15px' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {swipeLogs.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-4">No recent swipes found.</td></tr>
                                ) : (
                                    swipeLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '15px', fontWeight: '600' }}>{log.swiper_name}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    color: log.swipe_type.includes('Liked') ? '#17e27a' : (log.swipe_type.includes('Super Liked') ? '#2196f3' : '#fd5c63')
                                                }}>
                                                    {/* 👇 Backend se jo asali text aa raha hai, seedha wahi dikhao */}
                                                    {log.swipe_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>{log.target_name}</td>
                                            <td style={{ padding: '15px' }}>
                                                {log.is_match ? (
                                                    <span className="badge bg-success rounded-pill" style={{ padding: '6px 12px' }}>Matched 🤝</span>
                                                ) : (
                                                    <span style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                        No Match
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '15px', color: '#94a3b8', fontSize: '0.9rem' }}>{log.time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;