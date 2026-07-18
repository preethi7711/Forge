import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import HabitsManager from "./components/HabitsManager";
import Challenges from "./components/Challenges";
import Circles from "./components/Circles";
import Feed from "./components/Feed";
import Leaderboard from "./components/Leaderboard";
import {
  Flame,
  Shield,
  Trophy,
  Users,
  MessageSquare,
  Bell,
  LogOut,
  Sparkles,
  Menu,
  X,
  Compass,
  LayoutDashboard,
  CheckCircle,
  Sun,
  Moon
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("forge_token"));
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [circles, setCircles] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("forge_dark_mode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("forge_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("forge_dark_mode", "false");
    }
  }, [darkMode]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Live Toast & Broadcast Celebrations
  const [toast, setToast] = useState(null);
  const [celebrationToast, setCelebrationToast] = useState(null);

  // Sockets Ref
  const socketRef = useRef(null);

  // Initialize Authorization Header on startup
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Fetch all core user and social data
  const fetchAllData = async () => {
    if (!token) return;
    try {
      const [meRes, habitsRes, challengesRes, circlesRes, feedRes, notifsRes] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/habits"),
        axios.get("/api/challenges"),
        axios.get("/api/circles"),
        axios.get("/api/feed"),
        axios.get("/api/notifications"),
      ]);

      setUser(meRes.data);
      setHabits(habitsRes.data);
      setChallenges(challengesRes.data);
      setCircles(circlesRes.data);
      setFeedPosts(feedRes.data);
      setNotifications(notifsRes.data);
    } catch (err) {
      console.error("Failed to load user session, logging out.", err);
      handleLogout();
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Connect & configure Socket.io
  useEffect(() => {
    if (!token || !user) return;

    // Connect to host (Vite proxies to joint backend on port 3000)
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to Forge Server, registering user ID:", user.id);
      socket.emit("register", user.id);
    });

    // Real-time Push Notifications
    socket.on("notification", (data) => {
      // Trigger temporary toast alert
      setToast(data);
      setTimeout(() => setToast(null), 4500);

      // Reload notifications list
      axios.get("/api/notifications").then((res) => setNotifications(res.data));
    });

    // Real-time Circle Messages
    socket.on("circle-message", () => {
      // Reload circles to capture new message & rosters
      axios.get("/api/circles").then((res) => setCircles(res.data));
    });

    // Real-time Celebration Broadcasts
    socket.on("celebration-broadcast", (data) => {
      setCelebrationToast(data);
      setTimeout(() => setCelebrationToast(null), 5000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem("forge_token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("forge_token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setHabits([]);
    setChallenges([]);
    setCircles([]);
    setFeedPosts([]);
    setNotifications([]);
  };

  // ----------------------------------------------------
  // CLIENT API CALL PROXIES (Passed as props)
  // ----------------------------------------------------

  const handleCheckin = async (habitId, date) => {
    try {
      const res = await axios.post(`/api/habits/${habitId}/checkin`, { date });
      // Update specific habit in local list
      setHabits(prev => prev.map(h => h.id === habitId ? res.data.habit : h));
      
      // Refresh user profile stats (xp, streak, level, discipline)
      const profileRes = await axios.get("/api/auth/me");
      setUser(profileRes.data);

      // Trigger feed refresh since checkin generates a post
      const feedRes = await axios.get("/api/feed");
      setFeedPosts(feedRes.data);

      if (res.data.leveledUp) {
        setToast({
          text: `Leveled Up! You are now Level ${res.data.newLevel}! +1 Recovery Token earned.`,
          type: "system"
        });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHabit = async (habitData) => {
    try {
      const res = await axios.post("/api/habits", habitData);
      setHabits(prev => [...prev, res.data]);
      
      // Update profiles (discipline score)
      const profileRes = await axios.get("/api/auth/me");
      setUser(profileRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await axios.delete(`/api/habits/${habitId}`);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      
      // Update profiles
      const profileRes = await axios.get("/api/auth/me");
      setUser(profileRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (bio, missionStatement) => {
    try {
      const res = await axios.put("/api/auth/profile", { bio, missionStatement });
      if (res.data.success) {
        setUser(prev => prev ? { ...prev, bio, missionStatement } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChallenge = async (challengeData) => {
    try {
      const res = await axios.post("/api/challenges", challengeData);
      setChallenges(prev => [...prev, res.data]);

      // Reload social feed
      const feedRes = await axios.get("/api/feed");
      setFeedPosts(feedRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      const res = await axios.post(`/api/challenges/${challengeId}/join`);
      setChallenges(prev => prev.map(c => c.id === challengeId ? res.data : c));

      // Reload profile & feed
      const [profileRes, feedRes] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/feed")
      ]);
      setUser(profileRes.data);
      setFeedPosts(feedRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckinChallenge = async (challengeId) => {
    try {
      const res = await axios.post(`/api/challenges/${challengeId}/checkin`);
      setChallenges(prev => prev.map(c => c.id === challengeId ? res.data.challenge : c));

      // Reload profile & feed
      const [profileRes, feedRes] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/feed")
      ]);
      setUser(profileRes.data);
      setFeedPosts(feedRes.data);

      if (res.data.didCompleteChallenge) {
        setToast({
          text: `Challenge Conquered! Awarded badge and +${res.data.xpReward} XP!`,
          type: "challenge"
        });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCircle = async (name, description) => {
    try {
      const res = await axios.post("/api/circles", { name, description });
      setCircles(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinCircle = async (circleId) => {
    try {
      const res = await axios.post(`/api/circles/${circleId}/join`);
      setCircles(prev => prev.map(c => c.id === circleId ? res.data : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (circleId, text) => {
    if (!socketRef.current) return;
    axios.post(`/api/circles/${circleId}/messages`, { text }).then(() => {
      // Append locally first to feel immediate (optimistic update)
      setCircles(prev => prev.map(c => {
        if (c.id === circleId) {
          return {
            ...c,
            messages: [...c.messages, {
              id: Math.random().toString(),
              userId: user.id,
              username: user.username,
              text,
              timestamp: new Date().toISOString()
            }]
          };
        }
        return c;
      }));
    });
  };

  const handleAddPost = async (content) => {
    try {
      const res = await axios.post("/api/feed", { content });
      setFeedPosts(prev => [res.data, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await axios.post(`/api/feed/${postId}/like`);
      setFeedPosts(prev => prev.map(p => p.id === postId ? res.data : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCelebratePost = async (postId, type) => {
    try {
      const res = await axios.post(`/api/feed/${postId}/celebrate`, { type });
      setFeedPosts(prev => prev.map(p => p.id === postId ? res.data : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const res = await axios.post(`/api/feed/${postId}/comments`, { text });
      setFeedPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), res.data]
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async (targetId) => {
    try {
      await axios.post(`/api/social/follow/${targetId}`);
      // Reload profile
      const profileRes = await axios.get("/api/auth/me");
      setUser(profileRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await axios.put("/api/notifications/read");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // If not authenticated, force Auth views
  if (!token || !user) {
    return <Auth onAuthSuccess={handleAuthSuccess} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const NAV_ITEMS = [
    { id: "dashboard", label: "Identity Dashboard", icon: LayoutDashboard },
    { id: "habits", label: "Habit Arsenal", icon: CheckCircle },
    { id: "challenges", label: "Epic Quests", icon: Trophy },
    { id: "circles", label: "Accountability Cells", icon: Users },
    { id: "feed", label: "Social Stream", icon: MessageSquare },
    { id: "leaderboard", label: "Rankings", icon: Compass },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-[#F8F7F4] dark:bg-stone-950 text-neutral-900 dark:text-neutral-100 antialiased font-sans p-4 sm:p-6 lg:p-8 gap-6 md:gap-8 ${darkMode ? "dark" : ""}`} id="app-container">
      
      {/* REAL-TIME TOAST POPUP NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-white dark:bg-stone-900 border border-[#E7E5E4] dark:border-stone-800 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center gap-4 animate-slide-in max-w-sm">
          <div className="p-3 rounded-xl bg-[#C89B3C]/10 text-neutral-900 dark:text-stone-100">
            <Sparkles size={20} className="text-[#C89B3C]" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono tracking-wider font-extrabold text-neutral-400 dark:text-stone-500">Forge System</span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1 leading-relaxed">{toast.text}</p>
          </div>
        </div>
      )}

      {/* GLOBAL BROADCAST CELEBRATION FLOATING BANNER */}
      {celebrationToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-stone-900 border border-[#E7E5E4] dark:border-stone-800 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center gap-3 max-w-md w-[90%] justify-center text-center">
          <span className="text-xl">🔥</span>
          <p className="text-sm font-medium text-neutral-800 dark:text-stone-200">
            <strong className="text-black dark:text-white font-bold">@{celebrationToast.username}</strong> {celebrationToast.message}
          </p>
        </div>
      )}

      {/* Side Navigation panel (Desktop only) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-stone-900 border border-[#E7E5E4] dark:border-stone-800 rounded-[24px] shadow-[0_10px_35px_rgba(0,0,0,0.015)] h-[calc(100vh-3rem)] sticky top-6 p-6 z-20">
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black font-display shadow-sm">
              F
            </div>
            <h1 className="text-xl font-black tracking-tight font-display text-black dark:text-white">FORGE</h1>
          </div>

          {/* Nav Item Buttons */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                      : "text-neutral-500 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-stone-800/50"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account Controls footer */}
        <div className="border-t border-[#E7E5E4] dark:border-stone-800 pt-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-stone-800/40 border border-neutral-100 dark:border-stone-800/80 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-[#C89B3C] text-white flex items-center justify-center font-extrabold font-display text-xs">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-200 truncate">@{user.username}</h4>
              <p className="text-[10px] text-neutral-400 dark:text-stone-500 font-mono mt-0.5 font-bold">Lvl {user.level} Vanguard</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main page layout wrapper */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        
        {/* Top Header Navigation Bar (Premium SaaS Workspace Card) */}
        <header className="bg-white dark:bg-stone-900 border border-[#E7E5E4] dark:border-stone-800 rounded-[24px] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-30 mb-6 sm:mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          
          {/* Left panel info */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#C89B3C] bg-[#C89B3C]/5 dark:bg-[#C89B3C]/10 border border-[#C89B3C]/10 dark:border-[#C89B3C]/20 px-2.5 py-0.5 rounded-full font-bold">
                Vanguard System
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black text-[#111827] dark:text-white font-display capitalize tracking-tight leading-none mt-1">
              {activeTab === "dashboard" ? "Forge Command Deck" : NAV_ITEMS.find(n => n.id === activeTab)?.label || activeTab}
            </h2>
            
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-stone-400 font-medium leading-normal max-w-2xl">
              {activeTab === "dashboard" && "Forge your identity through structured habits, streaks, quests, and daily compounding actions."}
              {activeTab === "habits" && "Weaponize your routine and track your daily commitments."}
              {activeTab === "challenges" && "Cooperative high-stakes habits with customized badges and rewards."}
              {activeTab === "circles" && "Sync with accountability partners in private, live-synchronized rooms."}
              {activeTab === "feed" && "Chronological stream of real habit completions, milestones, and daily reflections."}
              {activeTab === "leaderboard" && "Rankings by discipline score (7-day habit completion) and active streak."}
            </p>
          </div>

          {/* Right panel quick actions & notifications */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <div className="flex items-center gap-2">
              {activeTab !== "dashboard" && (
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white dark:bg-stone-800 hover:bg-neutral-50 dark:hover:bg-stone-700 text-neutral-800 dark:text-stone-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-stone-700 transition-all cursor-pointer shadow-xs"
                >
                  Dashboard
                </button>
              )}
              {activeTab !== "habits" && (
                <button
                  onClick={() => setActiveTab("habits")}
                  className="bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-stone-100 text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  + Add Habit
                </button>
              )}
            </div>

            {/* Dark Mode Switch Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 bg-white dark:bg-stone-800 border border-neutral-200 dark:border-stone-700 text-neutral-600 dark:text-stone-300 hover:text-black dark:hover:text-white hover:border-neutral-350 dark:hover:border-stone-500 rounded-xl transition-all cursor-pointer shadow-xs"
              aria-label="Toggle Dark Mode"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} className="text-[#C89B3C]" /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadNotifCount > 0) {
                    handleMarkNotificationsRead();
                  }
                }}
                className="p-3 bg-white dark:bg-stone-800 border border-neutral-200 dark:border-stone-700 text-neutral-600 dark:text-stone-300 hover:text-black dark:hover:text-white hover:border-neutral-350 dark:hover:border-stone-500 rounded-xl transition-all relative cursor-pointer shadow-xs"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C89B3C] border-2 border-white text-white font-mono font-bold text-[9px] flex items-center justify-center rounded-full">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Menu list dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-stone-900 border border-[#E7E5E4] dark:border-stone-800 rounded-3xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.06)] z-40 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-stone-800 mb-4">
                    <span className="text-sm font-bold text-black dark:text-white font-display">Workspace Alerts</span>
                    <span className="text-[10px] text-neutral-400 dark:text-stone-500 font-mono uppercase font-semibold">Real-time</span>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-neutral-400 dark:text-stone-500 text-center py-8 font-medium">Alert feed is clear.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="text-xs bg-neutral-50 dark:bg-stone-800/40 p-3.5 border border-neutral-100 dark:border-stone-800 rounded-2xl flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#C89B3C] mt-1 shrink-0" />
                          <div>
                            <p className="text-neutral-800 dark:text-stone-200 leading-normal font-medium">{notif.text}</p>
                            <span className="text-[9px] text-neutral-400 dark:text-stone-555 font-mono mt-1.5 block font-semibold">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 text-neutral-800 dark:text-stone-200 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-stone-800 rounded-xl md:hidden border border-neutral-200 dark:border-stone-800"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Content viewport area */}
        <main className="flex-1 overflow-y-auto pr-1">
          {activeTab === "dashboard" && (
            <Dashboard
              user={user}
              habits={habits}
              onCheckin={handleCheckin}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === "habits" && (
            <HabitsManager
              habits={habits}
              onCreateHabit={handleCreateHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeTab === "challenges" && (
            <Challenges
              userId={user.id}
              challenges={challenges}
              onCreateChallenge={handleCreateChallenge}
              onJoinChallenge={handleJoinChallenge}
              onCheckinChallenge={handleCheckinChallenge}
            />
          )}

          {activeTab === "circles" && (
            <Circles
              userId={user.id}
              user={user}
              circles={circles}
              socket={socketRef.current}
              onCreateCircle={handleCreateCircle}
              onJoinCircle={handleJoinCircle}
              onSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "feed" && (
            <Feed
              userId={user.id}
              feedPosts={feedPosts}
              onAddPost={handleAddPost}
              onLikePost={handleLikePost}
              onCelebratePost={handleCelebratePost}
              onAddComment={handleAddComment}
            />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard
              userId={user.id}
              user={user}
              onFollowToggle={handleFollowToggle}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer (Hidden on Desktop) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay click block */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <aside className="relative w-72 bg-white dark:bg-stone-900 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-8">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-extrabold font-display">
                    F
                  </div>
                  <h1 className="text-lg font-black text-black dark:text-white font-display">FORGE</h1>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-neutral-400 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-stone-800 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-semibold cursor-pointer ${
                        isActive
                          ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                          : "text-neutral-500 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-stone-800"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-[#E7E5E4] dark:border-stone-800 pt-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-stone-800/40 border border-neutral-100 dark:border-stone-800 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-[#C89B3C] text-white flex items-center justify-center font-bold font-display text-xs">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-200 truncate">@{user.username}</h4>
                  <p className="text-[10px] text-neutral-400 dark:text-stone-500 font-mono font-bold">Lvl {user.level} Vanguard</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
