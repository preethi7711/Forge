import React, { useState } from "react";
import LucideIcon from "./LucideIcon";
import { Flame, Activity, Trash2, Plus, X } from "lucide-react";

const CATEGORIES = [
  { id: "all", name: "All Pursuits", icon: "Grid" },
  { id: "health", name: "Body & Health", icon: "Activity" },
  { id: "coding", name: "Software Craft", icon: "Code" },
  { id: "mind", name: "Mind & Spirit", icon: "Brain" },
  { id: "study", name: "Intellectual Study", icon: "BookOpen" },
  { id: "routine", name: "Routine Habits", icon: "Flame" },
];

const ICONS = ["Flame", "Code", "Brain", "Activity", "BookOpen", "Timer", "Compass", "Shield"];

const COLORS = [
  { class: "bg-indigo-600", border: "border-indigo-500", text: "text-indigo-400", name: "Indigo Slate" },
  { class: "bg-emerald-600", border: "border-emerald-500", text: "text-emerald-400", name: "Emerald Moss" },
  { class: "bg-purple-600", border: "border-purple-500", text: "text-purple-400", name: "Aether Purple" },
  { class: "bg-orange-600", border: "border-orange-500", text: "text-orange-400", name: "Solar Orange" },
  { class: "bg-rose-600", border: "border-rose-500", text: "text-rose-400", name: "Crimson Forge" },
  { class: "bg-sky-600", border: "border-sky-500", text: "text-sky-400", name: "Cosmic Sky" },
];

export default function HabitsManager({ habits, onCreateHabit, onDeleteHabit }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("routine");
  const [difficulty, setDifficulty] = useState("easy");
  const [target, setTarget] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("bg-indigo-600");
  const [icon, setIcon] = useState("Flame");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !target) return;

    setSaving(true);
    try {
      await onCreateHabit({
        name,
        category,
        difficulty,
        target,
        frequency,
        notes,
        color,
        icon,
      });
      // Reset
      setName("");
      setTarget("");
      setNotes("");
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredHabits = selectedCategory === "all" 
    ? habits 
    : habits.filter(h => h.category === selectedCategory);

  return (
    <div className="space-y-6 pb-12" id="habits-manager-section">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[24px] border border-[#E7E5E4] shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
        <div>
          <h2 className="text-xl font-black text-neutral-900 font-display">Habit Arsenal</h2>
          <p className="text-xs text-neutral-400 font-medium">Weaponize daily actions into consistent identity</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} /> Draft New Habit
        </button>
      </div>

      {/* Category Horizontal Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-black border-black text-white"
                : "bg-white border-[#E7E5E4] text-neutral-500 hover:text-black hover:bg-neutral-50"
            }`}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-[24px] shadow-[0_10px_35px_rgba(0,0,0,0.015)]">
          <LucideIcon name="Shield" className="mx-auto text-neutral-400 mb-3" size={36} />
          <h4 className="text-sm font-bold text-neutral-800">No habits draft in this category</h4>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            Build discipline by creating recurring commitments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.03)] transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.015)] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${habit.color || 'bg-black'} text-white shadow-xs`}>
                    <LucideIcon name={habit.icon} size={18} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded capitalize font-mono font-bold">
                      {habit.difficulty}
                    </span>
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                      title="Decommission Habit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-black text-neutral-900 mt-5 font-display truncate">
                  {habit.name}
                </h3>
                {habit.notes && (
                  <p className="text-xs text-[#6B7280] font-medium mt-1.5 line-clamp-2 leading-relaxed">
                    {habit.notes}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-5 border-t border-neutral-100 pt-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono font-bold">Target</span>
                    <p className="text-xs text-neutral-800 font-bold mt-0.5">{habit.target}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono font-bold">Frequency</span>
                    <p className="text-xs text-neutral-800 font-bold capitalize mt-0.5">{habit.frequency}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-5">
                <div className="flex items-center gap-1.5">
                  <Flame size={15} className="text-orange-500 fill-orange-500/10" />
                  <span className="text-xs text-neutral-400 font-semibold">Streak:</span>
                  <span className="text-xs text-orange-600 font-extrabold font-mono">{habit.streak}d</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400 font-mono font-bold">Peak: {habit.longestStreak}d</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

            <h3 className="text-xl font-black text-neutral-900 font-display mb-1.5">Build New Promise Habit</h3>
            <p className="text-xs text-neutral-400 font-medium mb-6">Commit to a clear actionable routine below</p>

            <form onSubmit={handleSave} className="space-y-4.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Habit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Write Code, Read Literature, Hydrate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  >
                    <option value="routine">Routine</option>
                    <option value="health">Body & Health</option>
                    <option value="coding">Software Craft</option>
                    <option value="mind">Mind & Spirit</option>
                    <option value="study">Intellectual Study</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  >
                    <option value="easy">Easy (10 XP)</option>
                    <option value="medium">Medium (20 XP)</option>
                    <option value="hard">Hard (30 XP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Daily Goal Target</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 30 mins, 1 page, 100 reps"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-medium"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Aesthetic Color Theme</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.class}
                      type="button"
                      onClick={() => setColor(c.class)}
                      className={`h-8 rounded-lg ${c.class} border-2 transition-all cursor-pointer ${
                        color === c.class ? "border-black ring-2 ring-neutral-200" : "border-transparent"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Lucide Icon</label>
                <div className="grid grid-cols-8 gap-2">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`h-10 rounded-lg bg-neutral-50 border flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-all cursor-pointer ${
                        icon === i ? "border-black text-black bg-neutral-100" : "border-neutral-200"
                      }`}
                    >
                      <LucideIcon name={i} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 font-mono">Notes (Optional)</label>
                <textarea
                  placeholder="Details, prompts, or reflections to motivate checkins..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[14px] px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black h-20 resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? "Drafting..." : "Forge Commitment"}
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
