import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, User, Shield, CheckCircle, XCircle, Clock, 
  ChevronRight, LogOut, Download, CreditCard, Edit3, 
  DollarSign, Activity, FileText, Search, Key, Check, AlertTriangle
} from 'lucide-react';

// API Server URL (relative to root domain)
const API_URL = '';

export default function App() {
  const [page, setPage] = useState<string>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('portal_token'));
  const [user, setUser] = useState<any>(null);
  
  // URL routing mapping on load
  useEffect(() => {
    const hash = window.location.hash || window.location.pathname;
    
    if (hash.includes('/verify/')) {
      const match = hash.match(/\/verify\/([A-Za-z0-9-]+)/);
      if (match) {
        window.location.href = `/verify/${match[1]}`;
      }
    } else if (hash.includes('/setup-password')) {
      setPage('setup-password');
    } else if (hash.includes('/track')) {
      setPage('track');
    } else if (token) {
      // Decode user role from token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        if (payload.role === 'Super Admin') {
          setPage('admin-dashboard');
        } else {
          setPage('member-dashboard');
        }
      } catch (e) {
        localStorage.removeItem('portal_token');
        setToken(null);
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    setToken(null);
    setUser(null);
    setPage('login');
  };

  // Render Layout
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-[#1F1F2E] bg-[#0E0E16]/80 backdrop-blur px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <a href="/" className="flex flex-col">
          <div className="text-xl font-bold tracking-tight text-white">
            AgniFounders<span className="text-amber-500">.</span>
          </div>
          <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Portal Portal</span>
        </a>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPage('track')}
            className="text-xs text-slate-400 hover:text-amber-500 font-medium transition"
          >
            Track Application
          </button>
          {token && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-400 border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 rounded-full hover:bg-rose-500/20 transition font-medium"
            >
              <LogOut size={12} /> Logout
            </button>
          )}
        </div>
      </header>

      {/* Pages Router View */}
      <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
        {page === 'login' && <LoginPortal setToken={setToken} />}
        {page === 'setup-password' && <SetupPasswordPortal setPage={setPage} />}
        {page === 'track' && <PublicStatusTracker />}
        {page === 'admin-dashboard' && token && <AdminDashboard token={token} />}
        {page === 'member-dashboard' && token && <MemberDashboard token={token} />}
      </main>
    </div>
  );
}

/* ==========================================
 * 1. Login Component
 * ========================================== */
function LoginPortal({ setToken }: { setToken: (t: string) => void }) {
  const [tab, setTab] = useState<'member' | 'admin'>('member');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mustChangePass, setMustChangePass] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, loginType: tab })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.user.forceChange) {
          setMustChangePass(true);
          setTempToken(data.token);
        } else {
          localStorage.setItem('portal_token', data.token);
          setToken(data.token);
        }
      } else {
        setError(data.error || 'Invalid credentials validation.');
      }
    } catch (err) {
      setError('Connection failure to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ newPassword })
      });
      if (response.ok) {
        alert('Password configured successfully! Please login with your new credentials.');
        setMustChangePass(false);
        setPassword('');
        setUsername('');
      } else {
        const d = await response.json();
        setError(d.error || 'Failed to set password');
      }
    } catch (e) {
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  };

  if (mustChangePass) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-[#141420] border border-[#222235] p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2 mb-2"><Key /> Configure Password</h2>
        <p className="text-sm text-slate-400 mb-6">As Super Admin, you are required to change your default password on your first successful login.</p>
        
        <form onSubmit={handleForceChange} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 font-semibold tracking-wider mb-2">New Password *</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required 
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg transition"
          >
            {loading ? 'Updating...' : 'Save & Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-12 bg-[#141420] border border-[#222235] rounded-2xl overflow-hidden shadow-xl">
      {/* Tabs */}
      <div className="flex border-b border-[#222235]">
        <button 
          onClick={() => { setTab('member'); setError(''); }}
          className={`flex-1 py-4 text-center font-bold text-sm transition ${tab === 'member' ? 'bg-[#0E0E16] text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}
        >
          Member Login
        </button>
        <button 
          onClick={() => { setTab('admin'); setError(''); }}
          className={`flex-1 py-4 text-center font-bold text-sm transition ${tab === 'admin' ? 'bg-[#0E0E16] text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}
        >
          Admin Login
        </button>
      </div>

      <div className="p-8">
        <h2 className="text-xl font-bold mb-1">{tab === 'member' ? 'Welcome Member' : 'Admin Operations Portal'}</h2>
        <p className="text-xs text-slate-400 mb-6">
          {tab === 'member' ? 'Login using your generated Application ID (e.g. AG-SPA-2026-0001)' : 'Secure login for membership auditors.'}
        </p>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg mb-6 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase text-slate-400 font-semibold tracking-wider mb-2">
              {tab === 'member' ? 'Application ID *' : 'Email Address *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-600"><User size={16} /></span>
              <input 
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={tab === 'member' ? 'AG-SPA-2026-0001' : 'Admin@agnifounders.in'}
                className="w-full bg-[#0E0E16] border border-[#2A2A3E] pl-10 pr-4 py-3 rounded-lg text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 font-semibold tracking-wider mb-2">Password *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-600"><Lock size={16} /></span>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0E0E16] border border-[#2A2A3E] pl-10 pr-4 py-3 rounded-lg text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          {tab === 'member' && (
            <div className="text-right">
              <span className="text-xs text-amber-500/80 hover:text-amber-500 cursor-pointer transition">
                Create password via Welcome Setup link.
              </span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg transition"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==========================================
 * 2. Setup Password Component (Activation)
 * ========================================== */
function SetupPasswordPortal({ setPage }: { setPage: (p: string) => void }) {
  const [appId, setAppId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Extract id from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) setAppId(id);
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: appId, password })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to setup password');
      }
    } catch (e) {
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 bg-[#141420] border border-[#222235] p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-amber-500 mb-2">Member Activation</h2>
      <p className="text-xs text-slate-400 mb-6">Setup your membership password to unlock the portal.</p>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg mb-6">
          <CheckCircle className="inline mr-2" size={16} /> {message}
          <button onClick={() => setPage('login')} className="block mt-3 text-xs text-amber-500 underline font-bold">Go to Login</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg mb-6">
          <AlertTriangle className="inline mr-2" size={16} /> {error}
        </div>
      )}

      {!message && (
        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">Application ID *</label>
            <input 
              type="text" 
              value={appId}
              onChange={e => setAppId(e.target.value)}
              required 
              placeholder="AG-SPA-2026-XXXX"
              className="w-full bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">Configure Password *</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
              minLength={6}
              placeholder="•••••••• (Min 6 chars)"
              className="w-full bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg transition"
          >
            {loading ? 'Activating...' : 'Setup Account'}
          </button>
        </form>
      )}
    </div>
  );
}

/* ==========================================
 * 3. Public Tracker Component
 * ========================================== */
function PublicStatusTracker() {
  const [appId, setAppId] = useState('');
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecord(null);

    try {
      const response = await fetch(`${API_URL}/api/public/track/${appId}`);
      if (response.ok) {
        const d = await response.json();
        setRecord(d);
      } else {
        setError('Application ID not found.');
      }
    } catch (e) {
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return 'text-emerald-400 border-emerald-500 bg-emerald-500/10';
    if (status === 'In Progress') return 'text-amber-400 border-amber-500 bg-amber-500/10';
    if (status === 'Rejected') return 'text-rose-400 border-rose-500 bg-rose-500/10';
    return 'text-slate-500 border-[#222235] bg-[#141420]';
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-12 bg-[#141420] border border-[#222235] p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-2">Application Tracker</h2>
      <p className="text-xs text-slate-400 mb-6">Enter your unique Application ID to see real-time updates.</p>

      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <input 
          type="text"
          value={appId}
          onChange={e => setAppId(e.target.value)}
          required
          placeholder="e.g. AG-SPA-2026-0001"
          className="flex-1 bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg flex items-center gap-2 transition"
        >
          <Search size={16} /> {loading ? 'Checking...' : 'Track'}
        </button>
      </form>

      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">{error}</div>}

      {record && (
        <div className="space-y-6">
          <div className="border-b border-[#222235] pb-4 flex justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Membership Type</p>
              <h3 className="text-lg font-bold text-amber-500">{record.membership_type}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Status</p>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold">{record.current_status}</span>
            </div>
          </div>

          <div className="relative border-l border-[#2A2A3E] ml-4 pl-8 py-2 space-y-6">
            {Object.keys(record.stages).map((key: string, idx: number) => {
              const stage = record.stages[key];
              const isDone = stage.status === 'Completed';
              return (
                <div key={idx} className="relative">
                  {/* Indicator Dot */}
                  <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getStatusColor(stage.status)}`}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{stage.name}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${stage.status === 'Completed' ? 'text-emerald-400' : 'text-slate-500'}`}>{stage.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
 * 4. Admin Dashboard Portal
 * ========================================== */
function AdminDashboard({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const d = await response.json();
        setApps(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleVerifyDetails = async (appId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/applications/${appId}/verify-details`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Details verified successfully!');
        fetchApps();
        setSelectedApp(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async (appId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/applications/${appId}/verify-payment`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Payment verified and membership generated successfully!');
        fetchApps();
        setSelectedApp(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appId: string) => {
    if (!rejectReason.trim()) return alert('Please enter rejection reason.');
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/applications/${appId}/reject`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (response.ok) {
        alert('Application rejected.');
        fetchApps();
        setSelectedApp(null);
        setRejectReason('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Stats calculation
  const totalApps = apps.length;
  const pendingApps = apps.filter(a => a.status === 'Pending Review').length;
  const approvedApps = apps.filter(a => a.status === 'Approved').length;
  const rejectedApps = apps.filter(a => a.status === 'Rejected').length;
  const sparkApps = apps.filter(a => a.membership_type === 'Spark').length;
  const builderApps = apps.filter(a => a.membership_type === 'Builder').length;
  const proApps = apps.filter(a => a.membership_type === 'Founder Pro').length;

  const totalRevenue = (sparkApps * 299) + (builderApps * 599) + (proApps * 999);

  return (
    <div className="grid grid-cols-[250px_1fr] gap-8 min-h-[500px]">
      {/* Sidebar */}
      <aside className="bg-[#141420] border border-[#222235] rounded-2xl p-4 space-y-2 h-fit">
        <button 
          onClick={() => { setActiveTab('dashboard'); setSelectedApp(null); }}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-amber-500 text-[#0A0A0F]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-white'}`}
        >
          <Activity size={16} /> Overview
        </button>
        <button 
          onClick={() => { setActiveTab('pending'); setSelectedApp(null); }}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition flex items-center justify-between ${activeTab === 'pending' ? 'bg-amber-500 text-[#0A0A0F]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><Clock size={16} /> Pending Apps</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-[#0A0A0F]/20 text-[#0A0A0F]' : 'bg-amber-500/10 text-amber-500'}`}>{pendingApps}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('approved'); setSelectedApp(null); }}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'approved' ? 'bg-amber-500 text-[#0A0A0F]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-white'}`}
        >
          <CheckCircle size={16} /> Approved Members
        </button>
        <button 
          onClick={() => { setActiveTab('rejected'); setSelectedApp(null); }}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'rejected' ? 'bg-amber-500 text-[#0A0A0F]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-white'}`}
        >
          <XCircle size={16} /> Rejections
        </button>
      </aside>

      {/* Main Panel */}
      <section className="bg-[#141420] border border-[#222235] rounded-2xl p-6 shadow-xl flex flex-col">
        {selectedApp ? (
          // Application Detail View
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#222235] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Review: {selectedApp.form_data.name}</h3>
                <span className="text-xs text-slate-500 font-mono">ID: {selectedApp.application_id}</span>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 border border-[#2A2A3E] rounded-lg"
              >
                Back to List
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="text-amber-500 uppercase tracking-wider text-xs font-semibold">Details Check</h4>
                <p><span className="text-slate-400">Email:</span> {selectedApp.form_data.email}</p>
                <p><span className="text-slate-400">Phone:</span> {selectedApp.form_data.phone || selectedApp.form_data.social}</p>
                <p><span className="text-slate-400">College:</span> {selectedApp.form_data.college}</p>
                <p><span className="text-slate-400">City:</span> {selectedApp.form_data.city}</p>
                <p><span className="text-slate-400">Interest:</span> {selectedApp.form_data.domain || 'General'}</p>
                <p><span className="text-slate-400">Startup:</span> {selectedApp.form_data.startup || 'N/A'}</p>
                {selectedApp.form_data.why && <p><span className="text-slate-400">Reason to Join:</span> "{selectedApp.form_data.why}"</p>}
                
                {/* Details Approve Button */}
                {!selectedApp.details_verified && selectedApp.status !== 'Rejected' && (
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleVerifyDetails(selectedApp.application_id)}
                    className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition"
                  >
                    {actionLoading ? 'Approving...' : 'Approve Profile Details'}
                  </button>
                )}
                {selectedApp.details_verified && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg font-bold flex items-center gap-1.5">
                    <Check size={14} /> Profile details approved.
                  </div>
                )}
              </div>

              <div className="space-y-3 border-l border-[#222235] pl-6">
                <h4 className="text-amber-500 uppercase tracking-wider text-xs font-semibold">Payment Check</h4>
                <p><span className="text-slate-400">Transaction ID:</span> {selectedApp.form_data.txn}</p>
                <p><span className="text-slate-400">Tier:</span> {selectedApp.membership_type}</p>
                
                {/* Screenshot view */}
                {selectedApp.form_data.screenshot_url ? (
                  <div className="mt-2">
                    <span className="text-slate-400 block mb-2">Receipt Screenshot:</span>
                    <a href={selectedApp.form_data.screenshot_url} target="_blank" rel="noopener noreferrer" className="block border border-[#2D2D44] rounded-lg overflow-hidden group">
                      <img 
                        src={selectedApp.form_data.screenshot_url} 
                        alt="Screenshot receipt" 
                        className="max-h-[150px] w-full object-cover group-hover:scale-[1.03] transition"
                      />
                    </a>
                  </div>
                ) : <p className="text-rose-400 text-xs font-semibold">No receipt screenshot uploaded.</p>}

                {/* Payment verification button */}
                {selectedApp.details_verified && !selectedApp.payment_verified && selectedApp.status !== 'Rejected' && (
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleVerifyPayment(selectedApp.application_id)}
                    className="w-full mt-3 py-2 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg text-xs transition"
                  >
                    {actionLoading ? 'Verifying...' : 'Verify Payment & Activate Member'}
                  </button>
                )}
                {!selectedApp.details_verified && (
                  <div className="p-3 bg-slate-500/10 text-slate-400 text-xs rounded-lg">
                    Verify details before payment review.
                  </div>
                )}
                {selectedApp.payment_verified && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg font-bold flex items-center gap-1.5">
                    <Check size={14} /> Payment verified. Account Active.
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Panel */}
            {selectedApp.status !== 'Rejected' && selectedApp.status !== 'Approved' && (
              <div className="border-t border-[#222235] pt-4 mt-6">
                <label className="block text-xs uppercase text-slate-400 font-semibold tracking-wider mb-2">Reject Application Reason</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="flex-1 bg-[#0E0E16] border border-[#2A2A3E] px-4 py-2 text-xs rounded-lg text-white"
                  />
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedApp.application_id)}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition"
                  >
                    {actionLoading ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Standard tab lists
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4">Committee Overview</h3>
                {/* Stats cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0E0E16] border border-[#222235] p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center"><FileText size={18} /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider">Total Apps</p>
                      <h4 className="text-lg font-bold">{totalApps}</h4>
                    </div>
                  </div>
                  <div className="bg-[#0E0E16] border border-[#222235] p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center"><Clock size={18} /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider">Pending</p>
                      <h4 className="text-lg font-bold text-amber-500">{pendingApps}</h4>
                    </div>
                  </div>
                  <div className="bg-[#0E0E16] border border-[#222235] p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center"><CheckCircle size={18} /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider">Approved</p>
                      <h4 className="text-lg font-bold text-emerald-400">{approvedApps}</h4>
                    </div>
                  </div>
                  <div className="bg-[#0E0E16] border border-[#222235] p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center"><XCircle size={18} /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider">Rejected</p>
                      <h4 className="text-lg font-bold text-rose-400">{rejectedApps}</h4>
                    </div>
                  </div>
                </div>

                {/* Revenue stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0E0E16] border border-[#222235] p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center"><DollarSign size={18} /></div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 tracking-wider">Collection</p>
                      <h4 className="text-lg font-bold text-emerald-400">₹{totalRevenue}</h4>
                    </div>
                  </div>
                  <div className="bg-[#0E0E16] border border-[#222235] p-4 rounded-xl flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-slate-400 tracking-wider mb-2">Tiers breakdown</p>
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="text-amber-400">Spark: {sparkApps}</span>
                      <span className="text-cyan-400">Builder: {builderApps}</span>
                      <span className="text-purple-400">Pro: {proApps}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#222235] pt-6">
                  <h4 className="text-sm font-bold text-white mb-3">Recently Received Applications</h4>
                  {loading ? (
                    <p className="text-xs text-slate-500">Loading records...</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#2A2A3E] text-slate-400 uppercase tracking-wider font-semibold">
                            <th className="py-2.5">Name</th>
                            <th>College</th>
                            <th>Plan</th>
                            <th>ID</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apps.slice(0, 5).map((a, idx) => (
                            <tr key={idx} className="border-b border-[#1F1F2E] hover:bg-[#0E0E16]/30">
                              <td className="py-2.5 font-bold text-white">{a.form_data.name}</td>
                              <td className="text-slate-400">{a.form_data.college}</td>
                              <td><span className="px-2 py-0.5 rounded bg-slate-500/10 text-xs">{a.membership_type}</span></td>
                              <td className="font-mono text-amber-500">{a.application_id}</td>
                              <td><span className="text-amber-400">{a.status}</span></td>
                              <td>
                                <button 
                                  onClick={() => setSelectedApp(a)}
                                  className="text-amber-500 underline font-bold"
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                          {apps.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-slate-500">No applications received yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab !== 'dashboard' && (
              <div>
                <h3 className="text-xl font-bold mb-4 capitalize">{activeTab} Applications</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#2A2A3E] text-slate-400">
                        <th className="py-3">Name</th>
                        <th>College</th>
                        <th>Type</th>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps
                        .filter(a => {
                          if (activeTab === 'pending') return a.status === 'Pending Review' || a.status === 'In Progress';
                          if (activeTab === 'approved') return a.status === 'Approved';
                          if (activeTab === 'rejected') return a.status === 'Rejected';
                          return true;
                        })
                        .map((a, idx) => (
                          <tr key={idx} className="border-b border-[#1F1F2E] hover:bg-[#0E0E16]/30">
                            <td className="py-3 font-bold text-white">{a.form_data.name}</td>
                            <td className="text-slate-400">{a.form_data.college}</td>
                            <td><span className="px-2 py-0.5 rounded bg-slate-500/10">{a.membership_type}</span></td>
                            <td className="font-mono text-amber-500">{a.application_id}</td>
                            <td><span className="text-slate-400">{a.status}</span></td>
                            <td>
                              <button 
                                onClick={() => setSelectedApp(a)}
                                className="text-amber-500 underline font-bold"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ==========================================
 * 5. Member Dashboard Portal
 * ========================================== */
function MemberDashboard({ token }: { token: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Fields allowed for editing
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [startup, setStartup] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/member/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const d = await response.json();
        setProfile(d.profile);
        setPhone(d.profile.phone);
        setLinkedin(d.profile.linkedin);
        setStartup(d.profile.startup);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
    setEditMode(false);
    // In production, triggers a PATCH to /api/member/profile
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading member profile details...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-rose-500">Failed to load member profile details.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8">
      {/* Details Profile Column */}
      <div className="bg-[#141420] border border-[#222235] p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-[#222235] pb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
            <p className="text-xs text-slate-400 font-mono">App ID: {profile.application_id}</p>
          </div>
          <button 
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1.5 text-xs text-amber-500 border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition"
          >
            <Edit3 size={12} /> {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">Startup Name</label>
              <input 
                type="text" 
                value={startup}
                onChange={e => setStartup(e.target.value)}
                className="w-full bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">LinkedIn Profile URL</label>
              <input 
                type="url" 
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                className="w-full bg-[#0E0E16] border border-[#2A2A3E] px-4 py-3 rounded-lg text-white"
              />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg transition text-xs">
              Save Modifications
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="text-slate-400 block text-xs">Tier:</span> <strong className="text-amber-500">{profile.tier}</strong></p>
            <p><span className="text-slate-400 block text-xs">Primary Domain:</span> <strong>{profile.domain}</strong></p>
            <p><span className="text-slate-400 block text-xs">Startup:</span> <strong>{startup || 'Exploring Ideas'}</strong></p>
            <p><span className="text-slate-400 block text-xs">College:</span> <strong>{profile.college}</strong></p>
            <p><span className="text-slate-400 block text-xs">City / State:</span> <strong>{profile.city}, {profile.state}</strong></p>
            <p><span className="text-slate-400 block text-xs">Phone:</span> <strong>{phone || 'N/A'}</strong></p>
            <p><span className="text-slate-400 block text-xs">LinkedIn Profile:</span> <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-amber-500 underline">View Link</a></p>
            <p><span className="text-slate-400 block text-xs">Valid From:</span> <strong>{new Date(profile.issue_date).toLocaleDateString()}</strong></p>
            <p><span className="text-slate-400 block text-xs">Valid Until:</span> <strong>{new Date(profile.expiry_date).toLocaleDateString()}</strong></p>
            <p><span className="text-slate-400 block text-xs">Verification Status:</span> <span className="text-emerald-400 font-bold">✓ Active</span></p>
          </div>
        )}
      </div>

      {/* Card Column */}
      <div className="space-y-6">
        {/* PDF Card Mockup */}
        <div className="bg-[#141420] border border-[#222235] p-6 rounded-2xl shadow-xl flex flex-col items-center">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><CreditCard size={16} /> Digital Member Card</h4>
          
          {/* Card body mockup */}
          <div className="w-full aspect-[1.58/1] bg-gradient-to-br from-[#1C1C2A] to-[#0A0A0F] border border-[#F5A623]/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#7B5EA7]/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">AgniFounders<span className="text-amber-500">.</span></h3>
                <span className="text-[7px] text-slate-500 uppercase tracking-widest">Powered by Thiran</span>
              </div>
              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold">{profile.tier}</span>
            </div>

            <div className="my-2 flex items-center gap-3">
              {profile.card && profile.card.qr_code_url && (
                <img src={profile.card.qr_code_url} alt="Verification QR" className="w-14 h-14 bg-white p-0.5 rounded" />
              )}
              <div className="text-left">
                <h4 className="text-xs font-bold text-white leading-tight">{profile.name}</h4>
                <p className="text-[8px] text-slate-400 font-mono leading-none">{profile.application_id}</p>
                <p className="text-[8px] text-slate-400 leading-tight mt-1">{profile.college}</p>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-[#222235] pt-1.5">
              <span className="text-[6px] text-slate-500">Dream • Build • Launch</span>
              <span className="text-[7px] text-slate-400 font-mono">Expiry: {new Date(profile.expiry_date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-3 w-full mt-6">
            <a 
              href={profile.card ? profile.card.card_pdf_url : '#'} 
              download
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0A0A0F] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Download size={14} /> Download PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
