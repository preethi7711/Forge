import React, { useState } from "react";
import { motion } from "motion/react";
import LucideIcon from "./LucideIcon";
import { Flame, Shield, Trophy, Activity, Check, Plus, Award } from "lucide-react";

export default function Dashboard({ user, habits, onCheckin, onNavigateToTab, onUpdateProfile }) {
  const [checkingId, setCheckingId] = useState(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState(user.bio || "");
  const [editMission, setEditMission] = useState(user.missionStatement || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleToggleCheckin = async (habitId) => {
    setCheckingId(habitId);
    try {
      await onCheckin(habitId, todayStr);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingId(null);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await onUpdateProfile(editBio, editMission);
      setIsEditingBio(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  // XP Progress Calculations (Level = floor(xp/200) + 1, next level at (level * 200))
  const levelFloorXP = (user.level - 1) * 200;
  const currentLevelProgress = user.xp - levelFloorXP;
  const levelProgressPercent = Math.max(0, Math.min(Math.round((currentLevelProgress / 200) * 100), 100));

  // Count today's completed habits
  const completedTodayCount = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const totalHabitsCount = habits.length;

  return (
    <div className="space-y-6 pb-12" id="dashboard-section">
      {/* Top Banner / Hero Profile */}
      <div className="relative bg-white border border-[#E7E5E4] rounded-[24px] p-6 sm:p-8 overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#C89B3C]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-[20px] bg-black flex items-center justify-center text-white text-3xl font-black font-display shadow-sm">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#C89B3C] text-white font-black text-[10px] px-2.5 py-1 rounded-full border-2 border-white uppercase tracking-wider font-mono shadow-sm">
                Lvl {user.level}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-[#111827] font-display">@{user.username}</h2>
                {user.disciplineScore >= 90 ? (
                  <span className="bg-[#C89B3C]/10 border border-[#C89B3C]/30 text-[#C89B3C] text-[10px] uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <Award size={12} /> ELITE CHAMPION
                  </span>
                ) : (
                  <span className="bg-neutral-50 border border-neutral-200 text-neutral-500 text-[10px] uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full font-bold">
                    VANGUARD RANK
                  </span>
                )}
              </div>
              
              {!isEditingBio ? (
                <div className="pt-1">
                  <p className="text-[#6B7280] text-sm font-medium leading-relaxed">{user.bio || "No identity pursuit declared yet."}</p>
                  {user.missionStatement && (
                    <p className="text-neutral-500 text-xs italic font-semibold font-display mt-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100 inline-block">
                      &ldquo;{user.missionStatement}&rdquo;
                    </p>
                  )}
                  <div>
                    <button 
                      onClick={() => {
                        setEditBio(user.bio || "");
                        setEditMission(user.missionStatement || "");
                        setIsEditingBio(true);
                      }}
                      className="text-[#C89B3C] hover:text-[#b0842e] text-xs font-bold mt-2.5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Edit Identity Statement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3 max-w-md">
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Describe your current pursuit..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-2.5 text-xs text-neutral-900 font-medium focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="text"
                    value={editMission}
                    onChange={(e) => setEditMission(e.target.value)}
                    placeholder="Write your personal mission statement..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-2.5 text-xs text-neutral-900 font-medium focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="bg-black hover:bg-neutral-800 text-white text-[12px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingBio(false)}
                      className="bg-white border border-neutral-200 text-neutral-600 hover:text-black text-[12px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Level / XP Progress Bar with Milestone Landmark */}
          <div className="w-full lg:w-80 space-y-3.5 border-t lg:border-t-0 lg:border-l border-[#E7E5E4] pt-5 lg:pt-0 lg:pl-6 shrink-0">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-neutral-400 uppercase tracking-wider font-mono">Rank Progression</span>
              <span className="text-neutral-900 font-mono font-black">
                {currentLevelProgress} / 200 XP
              </span>
            </div>
            
            <div className="relative pt-1.5">
              <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden border border-neutral-200/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgressPercent}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-[#C89B3C] h-full rounded-full"
                />
              </div>
              {/* Milestone Indicator */}
              <div 
                className="absolute -top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#C89B3C] shadow-xs flex items-center justify-center cursor-help"
                style={{ left: `calc(${levelProgressPercent}% - 8px)` }}
                title="Your XP milestone"
              >
                <div className="w-1 h-1 rounded-full bg-[#C89B3C]" />
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-semibold text-neutral-400">
              <span>Next Reward</span>
              <span className="text-[#C89B3C] font-bold">+1 Recovery Token</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Current Streak */}
        <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 md:p-7 relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.035)] transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-neutral-400 text-[12px] uppercase tracking-wider font-mono font-bold">Current Streak</p>
              <div className="text-orange-500">
                <Flame size={20} className="fill-orange-500/10" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-4xl md:text-[44px] font-black text-neutral-900 font-display tracking-tight leading-none">{user.streak}</span>
              <span className="text-sm text-neutral-500 font-extrabold">days</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-neutral-500 font-semibold border-t border-neutral-50 pt-2.5">
            <Shield size={14} className="text-[#C89B3C]" />
            <span>{user.recoveryTokens} Recovery Token{user.recoveryTokens !== 1 ? 's' : ''} left</span>
          </div>
        </div>

        {/* Metric 2: Longest Streak */}
        <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 md:p-7 relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.035)] transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-neutral-400 text-[12px] uppercase tracking-wider font-mono font-bold">All-Time Peak</p>
              <div className="text-[#C89B3C]">
                <Trophy size={20} className="fill-[#C89B3C]/5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-4xl md:text-[44px] font-black text-neutral-900 font-display tracking-tight leading-none">{user.longestStreak}</span>
              <span className="text-sm text-neutral-500 font-extrabold">days</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-4 font-semibold border-t border-neutral-50 pt-2.5">
            Highest historical peak streak
          </p>
        </div>

        {/* Metric 3: Discipline Score */}
        <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 md:p-7 relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.035)] transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-neutral-400 text-[12px] uppercase tracking-wider font-mono font-bold">Discipline Score</p>
              <div className="text-emerald-500">
                <Activity size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-4xl md:text-[44px] font-black text-neutral-900 font-display tracking-tight leading-none">{user.disciplineScore}%</span>
            </div>
          </div>
          <div className="w-full mt-4 border-t border-neutral-50 pt-2.5">
            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${user.disciplineScore}%` }}
                className={`h-full ${user.disciplineScore >= 80 ? 'bg-emerald-500' : user.disciplineScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Consistency Score */}
        <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 md:p-7 relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.035)] transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-neutral-400 text-[12px] uppercase tracking-wider font-mono font-bold">Consistency Score</p>
              <div className="text-neutral-800">
                <Check size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-4xl md:text-[44px] font-black text-neutral-900 font-display tracking-tight leading-none">{user.consistencyScore}%</span>
            </div>
          </div>
          <div className="w-full mt-4 border-t border-neutral-50 pt-2.5">
            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${user.consistencyScore}%` }}
                className="h-full bg-neutral-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Daily Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[20px] font-extrabold text-neutral-900 font-display">Daily Promises</h3>
                <p className="text-xs text-neutral-400 font-medium">Complete these habits to build streaks and level up</p>
              </div>
              <button
                onClick={() => onNavigateToTab("habits")}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F8F7F4] border border-[#E7E5E4] text-neutral-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Customize
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-2xl">
                <LucideIcon name="ShieldAlert" className="mx-auto text-neutral-400 mb-3" size={36} />
                <h4 className="text-sm font-bold text-neutral-800">No active habits for today</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto font-medium">
                  Forge your custom habits list to begin tracking your ascent.
                </p>
                <button
                  onClick={() => onNavigateToTab("habits")}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-5 py-3 rounded-xl mt-5 transition-all cursor-pointer shadow-xs"
                >
                  Create Your First Habit
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {habits.map((habit) => {
                  const isCompletedToday = habit.completedDates.includes(todayStr);
                  return (
                    <motion.div
                      key={habit.id}
                      whileHover={{ x: 2 }}
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                        isCompletedToday 
                          ? 'bg-neutral-50/70 border-neutral-200/50' 
                          : 'bg-neutral-50 border-neutral-150'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-3 rounded-xl ${habit.color || 'bg-black'} text-white shadow-xs shrink-0`}>
                          <LucideIcon name={habit.icon} size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-extrabold font-display ${isCompletedToday ? 'text-neutral-400 line-through font-medium' : 'text-neutral-900'}`}>
                              {habit.name}
                            </h4>
                            <span className="text-[10px] bg-neutral-200/60 text-neutral-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                              {habit.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1 text-xs text-neutral-400 font-semibold">
                            <span>Target: {habit.target}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-orange-600 font-mono">
                              <Flame size={12} /> {habit.streak}d streak
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleCheckin(habit.id)}
                        disabled={checkingId === habit.id}
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isCompletedToday
                            ? 'bg-[#C89B3C]/10 border-[#C89B3C] text-[#C89B3C] font-extrabold hover:bg-[#C89B3C]/20'
                            : 'bg-white border-neutral-200 text-neutral-400 hover:border-black hover:text-black shadow-xs'
                        }`}
                      >
                        {checkingId === habit.id ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isCompletedToday ? (
                          <Check size={20} className="stroke-[3]" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GitHub-Style 30-Day Contribution Heatmap */}
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[20px] font-extrabold text-neutral-900 font-display">Discipline Grid</h3>
                <p className="text-xs text-neutral-400 font-medium">Consistent action forms permanent identity</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 font-bold">
                <span>Missed</span>
                <span className="w-3.5 h-3.5 bg-neutral-100 border border-neutral-200 rounded-sm" />
                <span className="w-3.5 h-3.5 bg-emerald-100 rounded-sm" />
                <span className="w-3.5 h-3.5 bg-[#C89B3C] rounded-sm" />
                <span>Perfect</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="bg-neutral-50 p-5 border border-neutral-100 rounded-2xl overflow-x-auto">
              <div className="grid grid-flow-col grid-rows-7 gap-2 min-w-[280px]">
                {user.history && user.history.length > 0 ? (
                  user.history.map((day) => {
                    let colorClass = "bg-neutral-100 border border-neutral-200 hover:ring-2 hover:ring-neutral-300";
                    if (day.status === "perfect") {
                      colorClass = "bg-[#C89B3C] hover:ring-2 hover:ring-black";
                    } else if (day.status === "partial") {
                      colorClass = "bg-emerald-100 border border-emerald-200 hover:ring-2 hover:ring-emerald-400";
                    }

                    return (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.completedCount}/${day.totalCount} completed`}
                        className={`w-5 h-5 rounded-md transition-all cursor-help ${colorClass}`}
                      />
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-neutral-400 font-medium py-8">
                    Log check-ins to unlock your consistency heatmap visualization.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Badges & growth timeline */}
        <div className="space-y-6">
          {/* Badge Showcase */}
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
            <h3 className="text-[20px] font-extrabold text-neutral-900 font-display mb-4">Conquered Badges</h3>
            
            {user.badges && user.badges.length === 0 ? (
              <p className="text-xs text-neutral-400 font-medium text-center py-8">No badges conquered yet. Keep habits alive to unlock milestones.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {user.badges && user.badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={`${badge.name}: ${badge.description}`}
                    className="flex flex-col items-center bg-neutral-50 border border-neutral-100 p-3 rounded-2xl text-center group cursor-help hover:border-[#C89B3C] transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LucideIcon name={badge.icon} size={20} className="text-[#C89B3C]" />
                    </div>
                    <span className="text-[10px] text-neutral-800 font-bold truncate w-full mt-2.5">
                      {badge.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Growth Timeline */}
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
            <h3 className="text-[20px] font-extrabold text-neutral-900 font-display mb-4">Ascent Logs</h3>
            
            <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1">
              {user.growthTimeline && user.growthTimeline.length > 0 ? (
                user.growthTimeline.map((item, idx) => (
                  <div key={idx} className="flex gap-4 text-xs font-medium">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm mt-1" />
                      {idx !== user.growthTimeline.length - 1 && (
                        <div className="w-0.5 grow bg-neutral-100 my-1.5" />
                      )}
                    </div>
                    <div className="pb-4">
                      <span className="text-[10px] font-mono text-neutral-400 font-bold">{item.date}</span>
                      <p className="text-neutral-800 mt-1 leading-relaxed font-medium">{item.event}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 font-medium">No events logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
