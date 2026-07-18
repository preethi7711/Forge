import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { ShieldAlert, Mail, Lock, User, Sparkles, Sun, Moon } from "lucide-react";

export default function Auth({ onAuthSuccess, darkMode, setDarkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password || (!isLogin && !email)) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin 
        ? { username, password } 
        : { username, email, password };

      const response = await axios.post(endpoint, payload);
      const { token, user } = response.data;
      
      onAuthSuccess(token, user);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center bg-[#FDBA12] dark:bg-stone-950 px-4 py-12 relative overflow-hidden transition-colors duration-300 ${darkMode ? "dark" : ""}`} id="auth-section">
      {/* Floating Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 bg-white dark:bg-stone-900 border border-neutral-200/40 dark:border-stone-800 text-neutral-800 dark:text-stone-200 hover:text-black dark:hover:text-white hover:border-neutral-350 dark:hover:border-stone-600 rounded-xl transition-all cursor-pointer shadow-sm"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={18} className="text-[#C89B3C]" /> : <Moon size={18} />}
        </button>
      </div>

      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/20 dark:bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black dark:bg-[#C89B3C]/10 text-white dark:text-[#C89B3C] rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-6 shadow-sm border border-transparent dark:border-[#C89B3C]/20">
          <ShieldAlert size={14} className="text-[#FDBA12] dark:text-[#C89B3C]" />
          IDENTITY-DRIVEN PRODUCTIVITY
        </div>
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-black dark:text-white mb-3 font-display">
          FORGE
        </h1>
        <p className="text-neutral-800 dark:text-stone-300 text-sm sm:text-base font-semibold max-w-xs sm:max-w-md mx-auto">
          Forge discipline. Maintain consistency. Keep promises to yourself.
        </p>
      </motion.div>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-stone-900 border border-neutral-100 dark:border-stone-800 p-8 sm:p-10 rounded-3xl shadow-[0_24px_70px_rgba(17,17,17,0.12)] z-10"
      >
        <div className="flex justify-center mb-8 border-b border-neutral-100 dark:border-stone-800 pb-4">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 pb-3 text-center text-sm font-extrabold transition-colors duration-200 cursor-pointer ${isLogin ? "text-black dark:text-white border-b-3 border-black dark:border-white font-black" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-300"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 pb-3 text-center text-sm font-extrabold transition-colors duration-200 cursor-pointer ${!isLogin ? "text-black dark:text-white border-b-3 border-black dark:border-white font-black" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-300"}`}
          >
            Create Account
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: isLogin ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 15 : -15 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {error && (
              <div className="bg-rose-550/10 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-2">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-stone-850 border border-neutral-200 dark:border-stone-800 rounded-[14px] pl-11 pr-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#C89B3C] focus:bg-white dark:focus:bg-stone-850 focus:ring-1 focus:ring-black dark:focus:ring-[#C89B3C] transition-all placeholder:text-neutral-400 dark:placeholder:text-stone-500 font-medium"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-stone-850 border border-neutral-200 dark:border-stone-800 rounded-[14px] pl-11 pr-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#C89B3C] focus:bg-white dark:focus:bg-stone-850 focus:ring-1 focus:ring-black dark:focus:ring-[#C89B3C] transition-all placeholder:text-neutral-400 dark:placeholder:text-stone-500 font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-stone-850 border border-neutral-200 dark:border-stone-800 rounded-[14px] pl-11 pr-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#C89B3C] focus:bg-white dark:focus:bg-stone-850 focus:ring-1 focus:ring-black dark:focus:ring-[#C89B3C] transition-all placeholder:text-neutral-400 dark:placeholder:text-stone-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black dark:bg-[#C89B3C] hover:bg-neutral-800 dark:hover:bg-[#d6a84c] text-white dark:text-black font-bold py-3.5 px-5 rounded-xl text-[15px] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white disabled:opacity-50 mt-8 shadow-md active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} className="text-[#FDBA12] dark:text-stone-900" />
                  <span>{isLogin ? "Unlock Workspace" : "Begin My Ascent"}</span>
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>

      {/* Demo Account Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-neutral-800 dark:text-stone-400 mt-8 z-10 text-center font-bold"
      >
        Tip: Creating any unique username automatically provisions a secure personal workspace.
      </motion.p>
    </div>
  );
}
