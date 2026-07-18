import React, { useState, useEffect } from "react";
import axios from "axios";
import LucideIcon from "./LucideIcon";
import { Search, Trophy, Medal, UserPlus, UserMinus, Flame, Compass } from "lucide-react";

export default function Leaderboard({ userId, user, onFollowToggle }) {
  const [rankings, setRankings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRank, setLoadingRank] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  const fetchRankings = async () => {
    try {
      const res = await axios.get("/api/leaderboard");
      setRankings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRank(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [user.following?.length, user.disciplineScore, user.streak]);

  // Set initial followingMap
  useEffect(() => {
    if (user.following) {
      const map = {};
      user.following.forEach((id) => {
        map[id] = true;
      });
      setFollowingMap(map);
    }
  }, [user.following]);

  // Trigger search on query changes
  useEffect(() => {
    const triggerSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const res = await axios.get(`/api/users/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearch(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      triggerSearch();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleFollow = async (targetId) => {
    try {
      await onFollowToggle(targetId);
      // Toggle client-side state
      setFollowingMap(prev => ({
        ...prev,
        [targetId]: !prev[targetId]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto" id="leaderboard-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-neutral-100 shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-xl font-black text-neutral-900 font-display">Vanguard Leaderboard</h2>
          <p className="text-xs text-neutral-400 font-medium">Ranked by discipline score (7-day habit completion) and active streak</p>
        </div>

        {/* User Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search discipline builders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black placeholder:text-neutral-400 font-medium"
          />
        </div>
      </div>

      {/* Grid: Search Results vs Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rankings Table (Main) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-mono flex items-center gap-1.5">
            <Trophy size={14} /> Global Vanguard rankings
          </h3>

          <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
            {loadingRank ? (
              <div className="text-center py-16">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-neutral-400 font-medium">Retrieving ranks...</p>
              </div>
            ) : rankings.length === 0 ? (
              <p className="text-xs text-neutral-400 font-medium text-center py-12">Ranks table is empty.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 uppercase tracking-wider text-[9px] font-mono bg-neutral-50/50">
                      <th className="py-3.5 px-4 text-center font-bold">Rank</th>
                      <th className="py-3.5 px-4 font-bold">User</th>
                      <th className="py-3.5 px-4 text-center font-bold">Discipline</th>
                      <th className="py-3.5 px-4 text-center font-bold">Streak</th>
                      <th className="py-3.5 px-4 text-center font-bold">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rankings.map((row) => {
                      const isMe = row.id === userId;
                      const hasMedal = row.rank <= 3;
                      
                      let medalColor = "text-[#FDBA12]"; // gold
                      if (row.rank === 2) medalColor = "text-neutral-400"; // silver
                      if (row.rank === 3) medalColor = "text-orange-500"; // bronze

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-neutral-50/25 transition-all ${isMe ? 'bg-[#FDBA12]/10 font-bold' : ''}`}
                        >
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {hasMedal ? (
                              <Medal size={16} className={`inline-block ${medalColor}`} />
                            ) : (
                              row.rank
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-800 font-bold">@{row.username}</span>
                              {isMe && (
                                <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Me
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-mono font-bold ${row.disciplineScore >= 80 ? 'text-emerald-600' : 'text-neutral-500'}`}>
                              {row.disciplineScore}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-0.5 font-mono text-orange-600 font-bold">
                              <Flame size={12} /> {row.streak}d
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono bg-neutral-50 text-neutral-500 border border-neutral-150 px-2 py-0.5 rounded-md font-bold">
                              {row.level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Finder */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-mono">Profile Finder</h3>

          {searchQuery.trim() === "" ? (
            <div className="text-center py-16 bg-white border border-neutral-100 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
              <Compass size={24} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-xs text-neutral-400 font-medium px-4 leading-relaxed">Begin typing above to search and find accountability targets to follow.</p>
            </div>
          ) : loadingSearch ? (
            <div className="text-center py-8">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-400 font-medium bg-white border border-neutral-100 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.02)]">
              No users matching query.
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((userRow) => {
                const isMe = userRow.id === userId;
                const isFollowing = followingMap[userRow.id] || false;

                return (
                  <div
                    key={userRow.id}
                    className="bg-white border border-neutral-100 rounded-3xl p-5 hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.02)] space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1 font-display">
                          @{userRow.username}
                          {isMe && (
                            <span className="text-[8px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-bold uppercase">
                              Me
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-medium mt-1 line-clamp-1">{userRow.bio || "No biography provided"}</p>
                      </div>

                      {!isMe && (
                        <button
                          onClick={() => handleFollow(userRow.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                          }`}
                          title={isFollowing ? "Unfollow" : "Follow"}
                        >
                          {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono border-t border-neutral-100 pt-2.5 text-neutral-400 font-bold">
                      <span>Lvl {userRow.level}</span>
                      <span className="flex items-center gap-0.5 text-orange-600 font-bold">
                        <Flame size={10} /> {userRow.streak}d
                      </span>
                      <span className="text-emerald-600 font-black">{userRow.disciplineScore}% Disc</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
