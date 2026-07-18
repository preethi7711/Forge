import React, { useState } from "react";
import LucideIcon from "./LucideIcon";
import { Plus, X, Users, Award, Zap, ArrowUpRight } from "lucide-react";

export default function Challenges({ userId, challenges, onCreateChallenge, onJoinChallenge, onCheckinChallenge }) {
  const [isCreating, setIsCreating] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("coding");
  const [difficulty, setDifficulty] = useState("medium");
  const [durationDays, setDurationDays] = useState("30");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !description || !durationDays) return;

    setSaving(true);
    try {
      await onCreateChallenge({
        title,
        description,
        category,
        difficulty,
        durationDays,
        isPublic: true,
      });
      setTitle("");
      setDescription("");
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (challengeId) => {
    setJoiningId(challengeId);
    try {
      await onJoinChallenge(challengeId);
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCheckin = async (challengeId) => {
    setCheckingId(challengeId);
    try {
      await onCheckinChallenge(challengeId);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingId(null);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-12" id="challenges-section">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[24px] border border-[#E7E5E4] shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
        <div>
          <h2 className="text-xl font-black text-neutral-900 font-display">Epic Challenges</h2>
          <p className="text-xs text-neutral-400 font-medium">Cooperative high-stakes habits with badging & rewards</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} /> Deploy Challenge
        </button>
      </div>

      {/* Main Content Grid: Split into active quests vs search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Joined / Active Challenges */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">My Active Quests</h3>

          {challenges.filter(c => c.participants.some(p => p.userId === userId)).length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-[24px] shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
              <LucideIcon name="Trophy" className="mx-auto text-neutral-400 mb-3" size={36} />
              <h4 className="text-sm font-bold text-neutral-800 font-display">No active challenge quests</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1 font-medium leading-relaxed">
                Explore the global war-room on the right and click Join Challenge to commit.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {challenges
                .filter(c => c.participants.some(p => p.userId === userId))
                .map((challenge) => {
                  const myParticipant = challenge.participants.find(p => p.userId === userId);
                  const hasCheckedInToday = myParticipant ? myParticipant.completedDates.includes(todayStr) : false;

                  return (
                    <div
                      key={challenge.id}
                      className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.015)] space-y-5 hover:shadow-[0_15px_35px_rgba(0,0,0,0.03)] transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-600 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            {challenge.category} • {challenge.durationDays} Days
                          </span>
                          <h4 className="text-lg font-black text-neutral-900 pt-1.5 font-display">{challenge.title}</h4>
                          <p className="text-xs text-neutral-400 font-medium leading-relaxed">{challenge.description}</p>
                        </div>

                        <button
                          onClick={() => handleCheckin(challenge.id)}
                          disabled={hasCheckedInToday || checkingId === challenge.id}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                            hasCheckedInToday
                              ? 'bg-[#C89B3C]/10 border border-[#C89B3C]/30 text-[#C89B3C] cursor-not-allowed'
                              : 'bg-black hover:bg-neutral-800 text-white shadow-sm active:scale-95'
                          }`}
                        >
                          {checkingId === challenge.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : hasCheckedInToday ? (
                            <>Conquered Today</>
                          ) : (
                            <>Complete Task</>
                          )}
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-neutral-400 font-mono uppercase tracking-wider">My Ascent Progress</span>
                          <span className="text-neutral-900 font-mono font-black">{myParticipant ? myParticipant.progress : 0}%</span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200/50">
                          <div
                            style={{ width: `${myParticipant ? myParticipant.progress : 0}%` }}
                            className="bg-[#C89B3C] h-full rounded-full"
                          />
                        </div>
                      </div>

                      {/* Participant Progress Leaderboard */}
                      <div className="border-t border-neutral-100 pt-4 mt-4">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold flex items-center gap-1">
                          <Users size={12} /> Crew Progress ({challenge.participants.length})
                        </span>
                        <div className="grid grid-cols-2 gap-2 mt-2.5">
                          {challenge.participants.map((p) => (
                            <div key={p.userId} className="flex justify-between items-center text-xs bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100">
                              <span className="text-neutral-700 font-bold truncate">@{p.username}</span>
                              <span className="text-[#C89B3C] font-mono font-black">{p.progress}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Explore Challenges Room */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Global War-Room</h3>

          {challenges.filter(c => !c.participants.some(p => p.userId === userId)).length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E7E5E4] rounded-[24px] shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
              <Zap size={24} className="mx-auto text-neutral-400 mb-2" />
              <p className="text-xs text-neutral-400 font-medium px-4 leading-relaxed">No new challenges available. Deploy your own customized challenge quest above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges
                .filter(c => !c.participants.some(p => p.userId === userId))
                .map((challenge) => (
                  <div
                    key={challenge.id}
                    className="bg-white border border-[#E7E5E4] rounded-[24px] p-5 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.035)] transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.015)] space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded uppercase font-mono font-bold">
                          {challenge.category}
                        </span>
                        <span className="text-[10px] text-[#C89B3C] font-mono font-bold uppercase tracking-wider">
                          +{challenge.xpReward} XP Reward
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-neutral-900 font-display mt-2">{challenge.title}</h4>
                      <p className="text-xs text-neutral-400 font-medium mt-1 line-clamp-2 leading-relaxed">{challenge.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-neutral-105">
                      <span className="text-[10px] text-neutral-400 font-mono font-bold flex items-center gap-1">
                        <Users size={12} /> {challenge.participants.length} Active
                      </span>

                      <button
                        onClick={() => handleJoin(challenge.id)}
                        disabled={joiningId === challenge.id}
                        className="bg-black hover:bg-neutral-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        {joiningId === challenge.id ? (
                          <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Join Challenge <ArrowUpRight size={10} /></>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal Drawer */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-[0_24px_70px_rgba(0,0,0,0.1)] relative">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black hover:bg-neutral-50 p-1.5 rounded-xl cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-neutral-900 font-display mb-1.5">Deploy Global Challenge Quest</h3>
            <p className="text-xs text-neutral-400 font-medium mb-6">Create a shared consistency ritual for yourself and others</p>

            <form onSubmit={handleSave} className="space-y-4.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Days of Leetcode, No Sugar Ascent, Wake up early challenge"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Description & Mandates</label>
                <textarea
                  required
                  placeholder="Detail the daily task rules, expectation guidelines, and commitment promises..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black h-24 resize-none font-medium text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  >
                    <option value="coding">Coding</option>
                    <option value="health">Fitness</option>
                    <option value="routine">Routine</option>
                    <option value="mind">Spirituality</option>
                    <option value="study">Intellect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Duration</label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="100">100 Days</option>
                  </select>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl space-y-2 mt-4 text-xs font-medium leading-relaxed">
                <span className="font-extrabold text-[#C89B3C] flex items-center gap-1 uppercase tracking-wider font-mono text-[10px]">
                  <Award size={14} /> Completed Conquest Reward
                </span>
                <p className="text-neutral-500">
                  Completing this challenge will unlock the custom badge <strong className="text-neutral-800 font-bold">&ldquo;Challenger: {title || 'Quest'}&rdquo;</strong> and award <strong className="text-neutral-800 font-bold">+{parseInt(durationDays || "0") * 15} XP</strong> to rank levels.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? "Deploying..." : "Launch Quest"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-white border border-neutral-200 text-neutral-600 hover:text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-all cursor-pointer"
                >
                  Abort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
