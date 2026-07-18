import React, { useState, useEffect, useRef } from "react";
import LucideIcon from "./LucideIcon";
import { Plus, X, Users, MessageSquare, Send } from "lucide-react";

export default function Circles({ userId, user, circles, socket, onCreateCircle, onJoinCircle, onSendMessage }) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeCircleId, setActiveCircleId] = useState(null);
  
  // Creator form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Chat message state
  const [messageText, setMessageText] = useState("");
  const chatBottomRef = useRef(null);

  const activeCircle = circles.find(c => c.id === activeCircleId);

  // Handle auto scroll
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeCircle?.messages?.length, activeCircleId]);

  // Join/Leave socket room for the active circle
  useEffect(() => {
    if (socket && activeCircleId) {
      socket.emit("join-circle", activeCircleId);
    }
    return () => {
      if (socket && activeCircleId) {
        socket.emit("leave-circle", activeCircleId);
      }
    };
  }, [activeCircleId, socket]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description) return;

    setSaving(true);
    try {
      await onCreateCircle(name, description);
      setName("");
      setDescription("");
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeCircleId) return;

    onSendMessage(activeCircleId, messageText.trim());
    setMessageText("");
  };

  const myJoinedCircles = circles.filter(c => c.members.some(m => m.userId === userId));
  const exploreCircles = circles.filter(c => !c.members.some(m => m.userId === userId));

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px] flex flex-col md:flex-row gap-6 pb-4" id="circles-section">
      {/* Sidebar: Lists of groups */}
      <div className="w-full md:w-80 border border-[#E7E5E4] rounded-[24px] bg-white p-5 flex flex-col justify-between shrink-0 shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex justify-between items-center pb-3.5 border-b border-[#E7E5E4]">
            <div>
              <h3 className="text-sm font-black text-neutral-900 font-display">Accountability Circles</h3>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Collaborative consistency cells</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 rounded-xl border border-neutral-200 transition-all cursor-pointer animate-duration-300"
              title="Create New Circle"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* My Circles */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">My Cells</span>
            {myJoinedCircles.length === 0 ? (
              <p className="text-xs text-neutral-400 italic px-2 py-1 font-medium">No joined accountability cells.</p>
            ) : (
              myJoinedCircles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => setActiveCircleId(circle.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    activeCircleId === circle.id
                      ? "bg-black border-black text-white shadow-sm"
                      : "bg-neutral-50/50 border-neutral-100 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="w-full mr-2">
                    <h4 className="text-xs font-bold font-display truncate w-44">{circle.name}</h4>
                    <p className={`text-[10px] truncate w-44 mt-1 font-medium ${activeCircleId === circle.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {circle.description}
                    </p>
                  </div>
                  <Users size={12} className={activeCircleId === circle.id ? 'text-neutral-300' : 'text-neutral-400'} />
                </button>
              ))
            )}
          </div>

          {/* Explore Circles */}
          <div className="space-y-2.5 border-t border-[#E7E5E4] pt-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Explore Hub</span>
            {exploreCircles.length === 0 ? (
              <p className="text-xs text-neutral-400 italic px-2 py-1 font-medium">No other active circles. Create one above!</p>
            ) : (
              exploreCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="px-4 py-3.5 rounded-xl border border-neutral-100 bg-neutral-50/50 text-neutral-800 flex items-center justify-between hover:border-neutral-300 transition-all"
                >
                  <div className="w-36">
                    <h4 className="text-xs font-bold font-display truncate">{circle.name}</h4>
                    <p className="text-[9px] text-neutral-400 font-medium truncate mt-0.5">{circle.description}</p>
                  </div>
                  <button
                    onClick={() => onJoinCircle(circle.id)}
                    className="bg-black hover:bg-neutral-800 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Panel: Conversation & members */}
      <div className="grow border border-[#E7E5E4] rounded-[24px] bg-white flex overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
        {activeCircle ? (
          <>
            {/* Conversation Area */}
            <div className="flex-1 flex flex-col justify-between bg-neutral-50/10">
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#E7E5E4] bg-white flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-neutral-900 font-display">{activeCircle.name}</h3>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">{activeCircle.description}</p>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {activeCircle.messages && activeCircle.messages.map((msg) => {
                  const isSystem = msg.userId === "system";
                  const isMe = msg.userId === userId;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center text-center my-2">
                        <span className="bg-[#C89B3C]/10 border border-[#C89B3C]/20 text-[9px] text-[#C89B3C] px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-[10px] text-neutral-400 font-bold mb-1 px-1">
                        @{msg.username}
                      </span>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-black text-white rounded-tr-none shadow-sm font-medium"
                            : "bg-white border border-[#E7E5E4] text-neutral-850 rounded-tl-none font-medium shadow-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-neutral-400 mt-1 font-mono px-1 font-semibold">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-[#E7E5E4] bg-white flex gap-2.5">
                <input
                  type="text"
                  required
                  placeholder={`Coordinate with @${user.username}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-medium"
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-800 text-white p-3.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>

            {/* Members Directory Column */}
            <div className="w-64 border-l border-[#E7E5E4] bg-white p-4 shrink-0 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-3">Live Roster ({activeCircle.members.length})</span>
              <div className="space-y-2 overflow-y-auto flex-1">
                {activeCircle.members.map((member) => (
                  <div key={member.userId} className="flex justify-between items-center text-xs bg-neutral-50/50 border border-[#E7E5E4] rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-neutral-700 font-bold truncate w-32">@{member.username}</span>
                    </div>
                    <span
                      title="Discipline rating based on last 7 days checkin density"
                      className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-md cursor-help ${
                        member.disciplineScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : member.disciplineScore >= 50
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {member.disciplineScore}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-neutral-50/10">
            <MessageSquare size={36} className="text-neutral-300 mb-3" />
            <h4 className="text-sm font-bold text-neutral-800">Accountability Command Deck</h4>
            <p className="text-xs text-neutral-400 font-medium max-w-xs mt-1 leading-relaxed">
              Select an Accountability Circle from the sidebar roster or establish a new custom cell.
            </p>
          </div>
        )}
      </div>

      {/* Creator Modal Drawer */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] w-full max-w-md p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.1)] relative">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black hover:bg-neutral-50 p-1.5 rounded-xl cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-neutral-900 font-display mb-1.5">Commission Accountability Circle</h3>
            <p className="text-xs text-neutral-400 font-medium mb-6">Unite with others to coordinate daily consistency loops</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Circle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YC Founders Core, Iron Coders Vanguard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Purposes & Expectations</label>
                <textarea
                  required
                  placeholder="Write guidelines, focus pursuits (e.g. daily standup by 9 AM), and targets..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black h-24 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? "Establishing..." : "Establish Cell"}
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
