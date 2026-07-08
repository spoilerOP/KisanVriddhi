import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getTranslation } from './utils/translate';
import { FarmerDashboard } from './components/FarmerDashboard';
import { FarmProfile } from './components/FarmProfile';
import { CropRecommender } from './components/CropRecommender';
import { WeatherCenter } from './components/WeatherCenter';
import { CropHealthLog } from './components/CropHealthLog';
import { AssistantChat } from './components/AssistantChat';
import { OfficerDashboard } from './components/OfficerDashboard';
import { VoiceAssistant } from './components/VoiceAssistant';
import { TechShowcase } from './pages/TechShowcase';
import { JudgeMode } from './pages/JudgeMode';
import { 
  Sprout, Compass, CloudSun, Upload, Bot, LayoutDashboard, 
  Menu, X, Sun, Moon, LogOut, ShieldAlert, Lock, UserPlus, LogIn,
  Mic, Cpu, Sparkles
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading, login, register, logout, refreshMe } = useAuth();
  
  // Theme and Translation States
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  
  // Mobile menu status
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Active Tab for Farmer
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Authentication Form States
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    role: 'farmer' // Default
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    mobile: '',
    state: '',
    district: '',
    village: '',
    preferred_lang: 'en'
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleDemoMode = async () => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to seed and start demo mode.');
      }
      await refreshMe();
      setActiveTab('dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize Demo Mode.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoSwitchRole = async (targetRole: 'farmer' | 'officer') => {
    try {
      setAuthLoading(true);
      if (targetRole === 'officer') {
        await login({ username: 'officer_amit', password: 'demo1234' });
      } else {
        await login({ username: '9876500001', password: 'demo1234' });
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      alert('Failed to switch demo role: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Initialize Theme from localStorage/system
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update preferred language from user profile if loaded
  useEffect(() => {
    if (user && user.role === 'farmer' && profileForm.preferred_lang) {
      // Set lang initially to what's defined or default
      setLang(profileForm.preferred_lang);
    }
  }, [user]);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      setAuthError('');
      
      if (isRegister) {
        // Enforce strong password validation
        if (authForm.password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        
        // Mobile length
        if (authForm.role === 'farmer' && !/^\d{10,15}$/.test(profileForm.mobile)) {
          throw new Error("Mobile number must be a 10-15 digit number.");
        }
        
        // Trigger register api
        await register(
          {
            username: authForm.role === 'farmer' ? profileForm.mobile : authForm.username,
            password: authForm.password,
            role: authForm.role
          },
          {
            name: profileForm.name,
            mobile: profileForm.mobile,
            state: profileForm.state,
            district: profileForm.district,
            village: profileForm.village,
            preferred_lang: profileForm.preferred_lang
          }
        );
      } else {
        await login({
          username: authForm.username,
          password: authForm.password
        });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
        <p className="mt-4 text-xs font-semibold text-gray-500">Initializing KisanVriddhi...</p>
      </div>
    );
  }

  // --- UNAUTHENTICATED: LOGIN / REGISTER ---
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-zinc-950 font-sans">
        {/* Banner Column */}
        <div className="md:w-1/2 bg-gradient-to-br from-nature-600 to-nature-800 text-white p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
            <Sprout size={350} />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/10 rounded-2xl border border-white/20">
              <Sprout className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black font-sans tracking-wide">KisanVriddhi</h1>
          </div>
          <div className="my-10 relative z-10 max-w-md space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight">
              Empowering Farmers Through Intelligence.
            </h2>
            <p className="text-nature-100 text-sm leading-relaxed">
              Access real-time weather advisories, soil-based crop matching recommendations, expert disease diagnosis, and direct officer support — in your language.
            </p>
          </div>
          <div className="text-xs text-nature-200/80 relative z-10 font-medium">
            © 2026 KisanVriddhi. Empowering Farmers Through Intelligence.
          </div>
        </div>

        {/* Form Column */}
        <div className="md:w-1/2 flex items-center justify-center p-8 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={toggleDarkMode}
              className="p-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl shadow-premium text-gray-500 dark:text-zinc-300"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="w-full max-w-md space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-gray-800 dark:text-zinc-200">
                {isRegister ? 'Register Farmer Profile' : 'Access Commands Portal'}
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                {isRegister ? 'Complete registration to generate your unique Farmer ID.' : 'Sign in to access crop recommendations and alerts.'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 p-4 rounded-xl text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-semibold">
              {/* Role Picker (Visible on register) */}
              {isRegister && (
                <div>
                  <label className="block text-gray-500 mb-1.5">Register User Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthForm({ ...authForm, role: 'farmer' })}
                      className={`py-3 rounded-xl border font-bold transition ${
                        authForm.role === 'farmer' 
                          ? 'border-nature-500 text-nature-600 bg-nature-50/20' 
                          : 'border-gray-200 dark:border-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-850'
                      }`}
                    >
                      Farmer (किसान)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthForm({ ...authForm, role: 'officer' })}
                      className={`py-3 rounded-xl border font-bold transition ${
                        authForm.role === 'officer' 
                          ? 'border-nature-500 text-nature-600 bg-nature-50/20' 
                          : 'border-gray-200 dark:border-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-850'
                      }`}
                    >
                      Officer (अधिकारी)
                    </button>
                  </div>
                </div>
              )}

              {/* Login Fields */}
              {!isRegister ? (
                <>
                  <div>
                    <label className="block text-gray-500 mb-1.5">Mobile Number / Officer User</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={authForm.username}
                      onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-3 input-glow text-gray-800 dark:text-zinc-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1.5">Password</label>
                    <input
                      type="password"
                      placeholder="Enter security password"
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-3 input-glow text-gray-800 dark:text-zinc-200"
                      required
                    />
                  </div>
                </>
              ) : (
                /* Register Fields based on Role */
                authForm.role === 'farmer' ? (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 mb-1">Farmer Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Kumar"
                          value={profileForm.name}
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 input-glow text-gray-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Mobile Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={profileForm.mobile}
                          onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 input-glow text-gray-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-500 mb-1">State</label>
                        <input
                          type="text"
                          placeholder="e.g. Punjab"
                          value={profileForm.state}
                          onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-3 py-2.5 input-glow text-gray-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">District</label>
                        <input
                          type="text"
                          placeholder="Bhatinda"
                          value={profileForm.district}
                          onChange={e => setProfileForm({ ...profileForm, district: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-3 py-2.5 input-glow text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Village</label>
                        <input
                          type="text"
                          placeholder="Haripur"
                          value={profileForm.village}
                          onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-3 py-2.5 input-glow text-gray-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 mb-1">Preferred Language</label>
                        <select
                          value={profileForm.preferred_lang}
                          onChange={e => setProfileForm({ ...profileForm, preferred_lang: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 input-glow text-gray-850"
                        >
                          <option value="en">English</option>
                          <option value="hi">हिंदी (Hindi)</option>
                          <option value="ml">മലയാളം (Malayalam)</option>
                          <option value="te">తెలుగు (Telugu)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Security Password</label>
                        <input
                          type="password"
                          placeholder="Min 8 characters"
                          value={authForm.password}
                          onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 input-glow text-gray-800"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Officer registration */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-500 mb-1.5">Officer Username</label>
                      <input
                        type="text"
                        placeholder="e.g. officer_amit"
                        value={authForm.username}
                        onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-3 input-glow text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1.5">Security Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        value={authForm.password}
                        onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl px-4 py-3 input-glow text-gray-800"
                        required
                      />
                    </div>
                  </div>
                )
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-nature-600 hover:bg-nature-700 text-white rounded-xl font-extrabold text-sm shadow-premium flex items-center justify-center gap-2 disabled:opacity-50 mt-4 transition"
              >
                {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                {authLoading ? 'Authorizing...' : isRegister ? 'Complete Registration' : 'Authenticate Session'}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  onClick={handleDemoMode}
                  disabled={authLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-sm shadow-premium flex items-center justify-center gap-2 disabled:opacity-50 mt-2 transition"
                >
                  <Bot size={16} />
                  Launch One-Click Demo Mode (Judge View)
                </button>
              )}
            </form>

            <div className="text-center text-xs text-gray-400 mt-6 font-semibold">
              {isRegister ? 'Already registered on the platform?' : 'New farmer registration?'}{' '}
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setAuthError('');
                }}
                className="text-nature-600 dark:text-nature-400 hover:underline font-bold"
              >
                {isRegister ? 'Login Session' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED: CORE APPLICATION WRAPPER ---
  const farmerTabs = [
    { id: 'dashboard', name: getTranslation('dashboard', lang), icon: LayoutDashboard },
    { id: 'profile', name: getTranslation('farmProfile', lang), icon: Compass },
    { id: 'recommendation', name: getTranslation('recommendation', lang), icon: Sprout },
    { id: 'weather', name: getTranslation('weather', lang), icon: CloudSun },
    { id: 'disease', name: getTranslation('diseaseLog', lang), icon: Upload },
    { id: 'assistant', name: getTranslation('assistant', lang), icon: Bot },
    { id: 'voice', name: 'Voice Advisor', icon: Mic }
  ];

  const judgeTabs = [
    { id: 'tech', name: 'AI Tech Stack Showcase', icon: Cpu },
    { id: 'judge', name: 'Guided Walkthrough', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-950 font-sans text-gray-900 dark:text-zinc-50">
      {/* 1. Desktop Sidebar */}
      {user.role === 'farmer' && (
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-r border-gray-200/50 dark:border-zinc-800/50 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.06)] shrink-0 select-none z-40 transition-all duration-300">
          {/* Logo */}
          <div className="p-6 border-b border-gray-50 dark:border-zinc-800 flex items-center gap-2.5">
            <div className="p-1.5 bg-nature-600 text-white rounded-xl shadow-premium">
              <Sprout className="h-5 w-5" />
            </div>
            <h1 className="font-extrabold text-sm tracking-wide text-nature-600 dark:text-nature-400">
              {getTranslation('title', lang)}
            </h1>
          </div>

          {/* Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {farmerTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-nature-600 text-white shadow-premium'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {tab.name}
                </button>
              );
            })}

            {/* Judge Evaluation Section Divider */}
            <div className="pt-4 mt-4 border-t border-gray-150/40 dark:border-zinc-800/40">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block px-4 mb-2">
                Evaluation & Demo
              </span>
              {judgeTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-450 hover:text-indigo-650 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 text-indigo-500/80" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User profile footer */}
          <div className="p-4 border-t border-gray-50 dark:border-zinc-800 space-y-2">
            <div className="px-2 py-1">
              <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{user.farmer_id}</p>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/15 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              {getTranslation('logout', lang)}
            </button>
          </div>
        </aside>
      )}

      {/* 2. Mobile Sidebar Drawer Overlay */}
      {sidebarOpen && user.role === 'farmer' && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 p-4 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-zinc-850">
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-nature-600" />
                  <span className="font-extrabold text-xs">{getTranslation('title', lang)}</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <nav className="space-y-1">
                {farmerTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                        activeTab === tab.id
                          ? 'bg-nature-600 text-white shadow-premium'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {tab.name}
                    </button>
                  );
                })}

                {/* Judge Evaluation Section Divider */}
                <div className="pt-4 mt-4 border-t border-gray-150/45 dark:border-zinc-800/45 font-semibold text-xs">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block px-4 mb-2">
                    Evaluation & Demo
                  </span>
                  {judgeTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-450 hover:text-indigo-600 hover:bg-indigo-50/30'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0 text-indigo-500" />
                        {tab.name}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
            <div className="border-t border-gray-50 dark:border-zinc-850 pt-4 space-y-2">
              <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{user.name}</p>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 rounded-lg transition"
              >
                <LogOut className="h-4 w-4" />
                {getTranslation('logout', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 sticky top-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-gray-200/50 dark:border-zinc-800/50 flex justify-between items-center px-4 md:px-6 z-30 select-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3">
            {user.role === 'farmer' && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 dark:text-zinc-400 border border-gray-150 dark:border-zinc-800 rounded-xl"
              >
                <Menu size={18} />
              </button>
            )}
            <div className="lg:hidden flex items-center gap-2">
              <Sprout className="h-5 w-5 text-nature-600" />
              <span className="font-extrabold text-sm text-nature-600">{getTranslation('title', lang)}</span>
            </div>
            {/* Desktop Dashboard Breadcrumb */}
            <span className="hidden lg:inline text-xs font-bold text-gray-400 tracking-wide uppercase">
              {user.role === 'officer' ? getTranslation('officerDashboard', lang) : getTranslation(activeTab, lang)}
            </span>
          </div>

          {/* Translation and Dark Mode Actions */}
          <div className="flex items-center gap-3">
            {/* Demo Switcher */}
            {user.role === 'farmer' ? (
              <button
                onClick={() => handleDemoSwitchRole('officer')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Bot size={13} />
                Demo: Switch to Officer View
              </button>
            ) : (
              <button
                onClick={() => handleDemoSwitchRole('farmer')}
                className="px-3 py-1.5 bg-nature-50 hover:bg-nature-100 text-nature-700 dark:bg-nature-950/20 dark:text-nature-400 border border-nature-200 dark:border-nature-900/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Bot size={13} />
                Demo: Switch to Farmer View
              </button>
            )}

            {/* Multilingual Selector */}
            {user.role === 'farmer' && (
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="bg-gray-50 dark:bg-zinc-850 border border-gray-150 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-300"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            )}

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 border border-gray-150 dark:border-zinc-800 rounded-xl text-gray-500 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Officer Logout */}
            {user.role === 'officer' && (
              <button 
                onClick={logout}
                className="flex items-center gap-1 text-xs font-bold text-red-600 border border-red-200 dark:border-red-950/20 px-3 py-1.5 rounded-xl hover:bg-red-50"
              >
                <LogOut size={14} />
                {getTranslation('logout', lang)}
              </button>
            )}
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 dark:bg-zinc-950/30">
          {user.role === 'officer' ? (
            <OfficerDashboard lang={lang} />
          ) : (
            <>
              {activeTab === 'dashboard' && <FarmerDashboard lang={lang} onNavigate={setActiveTab} />}
              {activeTab === 'profile' && <FarmProfile lang={lang} />}
              {activeTab === 'recommendation' && <CropRecommender lang={lang} />}
              {activeTab === 'weather' && <WeatherCenter lang={lang} />}
              {activeTab === 'disease' && <CropHealthLog lang={lang} />}
              {activeTab === 'assistant' && <AssistantChat lang={lang} />}
              {activeTab === 'voice' && <VoiceAssistant lang={lang} />}
              {activeTab === 'tech' && <TechShowcase />}
              {activeTab === 'judge' && (
                <JudgeMode 
                  lang={lang} 
                  onSetFarmerId={(id) => {
                    if (id === "FARM-CRIT-992") {
                      login({ username: "9876500003", password: "demo1234" }).catch(e => console.error(e));
                    } else if (id === "FARM-MED-202") {
                      login({ username: "9876500002", password: "demo1234" }).catch(e => console.error(e));
                    } else {
                      login({ username: "9876500001", password: "demo1234" }).catch(e => console.error(e));
                    }
                  }}
                  onNavigate={setActiveTab}
                  currentFarmerId={user.farmer_id || ''}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
