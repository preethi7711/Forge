import React, { useState } from "react";
import LucideIcon from "./LucideIcon";
import { Heart, Send, MessageCircle } from "lucide-react";

export default function Feed({ userId, feedPosts, onAddPost, onLikePost, onCelebratePost, onAddComment }) {
  const [reflection, setReflection] = useState("");
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const handleShareReflection = async (e) => {
    e.preventDefault();
    if (!reflection.trim()) return;

    setSharing(true);
    try {
      await onAddPost(reflection.trim());
      setReflection("");
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  const handlePostComment = async (postId) => {
    if (!commentText.trim()) return;

    setSendingComment(true);
    try {
      await onAddComment(postId, commentText.trim());
      setCommentText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingComment(false);
    }
  };

  const getCardMetadata = (type) => {
    switch (type) {
      case "habit_completed":
        return {
          icon: "Check",
          colorClass: "text-emerald-700 bg-emerald-50 border-emerald-100",
          title: "Habit Conquered",
        };
      case "challenge_joined":
        return {
          icon: "Compass",
          colorClass: "text-neutral-750 bg-neutral-50 border-neutral-200/60",
          title: "Quest Joined",
        };
      case "challenge_completed":
        return {
          icon: "Award",
          colorClass: "text-amber-700 bg-amber-50 border-amber-200/60",
          title: "Quest Conquered",
        };
      case "streak_milestone":
        return {
          icon: "Flame",
          colorClass: "text-orange-700 bg-orange-50 border-orange-200/60",
          title: "Streak Milestone",
        };
      default:
        return {
          icon: "Brain",
          colorClass: "text-black bg-[#FDBA12]/15 border-[#FDBA12]/30",
          title: "Mind Ascent Reflection",
        };
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto" id="feed-section">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
        <h2 className="text-xl font-black text-neutral-900 font-display">Discipline Chronicles</h2>
        <p className="text-xs text-neutral-400 font-medium mt-1">Chronological feed of real completions, milestones, and reflections</p>
      </div>

      {/* Write Reflection Input card */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
        <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider font-mono mb-3">Share Daily Ascent Reflection</h3>
        <form onSubmit={handleShareReflection} className="space-y-3">
          <textarea
            required
            placeholder="Document your focus loops, struggles, progress or accountability promises today..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black h-20 resize-none placeholder:text-neutral-400 font-medium"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sharing || !reflection.trim()}
              className="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              {sharing ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={12} /> Share Reflection
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progress Stream */}
      <div className="space-y-4">
        {feedPosts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-100 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
            <LucideIcon name="MessageSquare" className="mx-auto text-neutral-300 mb-3" size={36} />
            <h4 className="text-sm font-bold text-neutral-800">Stream is clear</h4>
            <p className="text-xs text-neutral-400 font-medium mt-1">Completions and reflections will map here live.</p>
          </div>
        ) : (
          feedPosts.map((post) => {
            const meta = getCardMetadata(post.type);
            const hasLiked = post.likes.includes(userId);
            const myCelebration = post.celebrations.find(c => c.userId === userId);

            // Group celebrations to counts
            const fireCount = post.celebrations.filter(c => c.type === "fire").length;
            const clapCount = post.celebrations.filter(c => c.type === "clap").length;
            const saluteCount = post.celebrations.filter(c => c.type === "salute").length;

            return (
              <div
                key={post.id}
                className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.02)] hover:border-neutral-200 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 flex items-center justify-center font-bold font-display text-sm shrink-0">
                      {post.username.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-neutral-900 font-display">@{post.username}</h4>
                      <p className="text-[10px] text-neutral-400 font-mono font-bold mt-0.5">
                        {new Date(post.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold font-mono uppercase tracking-wider border px-3 py-1 rounded-full shrink-0 ${meta.colorClass}`}>
                    <LucideIcon name={meta.icon} size={10} /> {meta.title}
                  </span>
                </div>

                {/* Content */}
                <p className="text-xs text-neutral-700 leading-relaxed pl-1 font-medium">
                  {post.content}
                </p>

                {/* Action Controls & Reactions */}
                <div className="flex items-center justify-between border-y border-neutral-100 py-3 text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                        hasLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart size={14} className={hasLiked ? 'fill-rose-500' : ''} />
                      <span className="font-mono text-[11px] font-bold">{post.likes.length}</span>
                    </button>

                    {/* Celebration buttons */}
                    <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-150 px-2 py-0.5 rounded-lg">
                      <button
                        onClick={() => onCelebratePost(post.id, "fire")}
                        className={`hover:scale-125 transition-transform font-mono text-[11px] flex items-center gap-0.5 p-1 cursor-pointer ${myCelebration?.type === "fire" ? 'text-neutral-900 font-black scale-110' : 'text-neutral-400 hover:text-neutral-800'}`}
                        title="Cheer Fire"
                      >
                        🔥 {fireCount > 0 && <span className="text-[10px] font-bold">{fireCount}</span>}
                      </button>
                      <span className="text-neutral-200">|</span>
                      <button
                        onClick={() => onCelebratePost(post.id, "clap")}
                        className={`hover:scale-125 transition-transform font-mono text-[11px] flex items-center gap-0.5 p-1 cursor-pointer ${myCelebration?.type === "clap" ? 'text-neutral-900 font-black scale-110' : 'text-neutral-400 hover:text-neutral-800'}`}
                        title="Cheer Clap"
                      >
                        👏 {clapCount > 0 && <span className="text-[10px] font-bold">{clapCount}</span>}
                      </button>
                      <span className="text-neutral-200">|</span>
                      <button
                        onClick={() => onCelebratePost(post.id, "salute")}
                        className={`hover:scale-125 transition-transform font-mono text-[11px] flex items-center gap-0.5 p-1 cursor-pointer ${myCelebration?.type === "salute" ? 'text-neutral-900 font-black scale-110' : 'text-neutral-400 hover:text-neutral-800'}`}
                        title="Cheer Salute"
                      >
                        🫡 {saluteCount > 0 && <span className="text-[10px] font-bold">{saluteCount}</span>}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-black font-bold cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span className="font-mono text-[11px] font-bold">{post.comments ? post.comments.length : 0}</span>
                  </button>
                </div>

                {/* Comment Section Panel Drawer Toggle */}
                {commentingPostId === post.id && (
                  <div className="space-y-4 pt-1">
                    {/* Add comment Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Write constructive encouragement..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') handlePostComment(post.id); }}
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black font-medium"
                      />
                      <button
                        onClick={() => handlePostComment(post.id)}
                        disabled={sendingComment || !commentText.trim()}
                        className="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all text-xs shrink-0 cursor-pointer shadow-sm"
                      >
                        {sendingComment ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                      </button>
                    </div>

                    {/* Comments list */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2.5 max-h-40 overflow-y-auto pl-1">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-xs bg-neutral-50 border border-neutral-100 rounded-xl p-3">
                            <div className="flex justify-between text-[10px] font-bold">
                              <strong className="text-neutral-800 font-extrabold">@{comment.username}</strong>
                              <span className="text-neutral-400 font-mono">
                                {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-neutral-600 mt-1.5 leading-relaxed font-medium">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
