import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, saveDB } from "./db.js";
import { notifyUser, broadcastCircleMessage, broadcastCelebration } from "./socket.js";

export const routes = Router();

const JWT_SECRET = process.env.JWT_SECRET || "forge_super_secret_jwt_key_123";

// Helper: Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper: Get today's date in YYYY-MM-DD
const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

// Helper: Get yesterday's date in YYYY-MM-DD
const getYesterdayDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

// Middleware: Authenticate Token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = decoded;
    next();
  });
}

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// Register
routes.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: "Please fill in all fields" });
    return;
  }

  const existingUser = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    res.status(400).json({ error: "Username or email already exists" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const today = getTodayDateStr();

    const newUser = {
      id: generateId(),
      username,
      email,
      passwordHash,
      bio: "Forging my destiny.",
      missionStatement: "Keep promises to myself.",
      streak: 0,
      longestStreak: 0,
      disciplineScore: 100,
      consistencyScore: 100,
      xp: 0,
      level: 1,
      badges: [
        {
          id: "recruit",
          name: "Forge Recruit",
          description: "Initiated your journey into the Forge.",
          date: today,
          icon: "ShieldAlert",
        },
      ],
      recoveryTokens: 1,
      history: [],
      growthTimeline: [
        {
          date: today,
          event: "Joined the Forge platform",
          xpGained: 50,
        },
      ],
      following: [],
      followers: [],
      createdAt: today,
    };

    // Add initial entry growth XP
    newUser.xp = 50;

    db.users = [...db.users, newUser];

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: "30d" });

    // Send welcome notification
    const welcomeNotification = {
      id: generateId(),
      userId: newUser.id,
      text: "Welcome to Forge! Create your first Habit to begin forging discipline.",
      type: "system",
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    db.notifications = [...db.notifications, welcomeNotification];

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
        missionStatement: newUser.missionStatement,
        streak: newUser.streak,
        longestStreak: newUser.longestStreak,
        disciplineScore: newUser.disciplineScore,
        consistencyScore: newUser.consistencyScore,
        xp: newUser.xp,
        level: newUser.level,
        badges: newUser.badges,
        recoveryTokens: newUser.recoveryTokens,
        growthTimeline: newUser.growthTimeline,
        following: newUser.following,
        followers: newUser.followers,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login
routes.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Please enter username and password" });
    return;
  }

  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  // Before responding, trigger a check/refresh of their streaks
  refreshUserStreaks(user.id);

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      missionStatement: user.missionStatement,
      streak: user.streak,
      longestStreak: user.longestStreak,
      disciplineScore: user.disciplineScore,
      consistencyScore: user.consistencyScore,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      recoveryTokens: user.recoveryTokens,
      growthTimeline: user.growthTimeline,
      following: user.following,
      followers: user.followers,
    },
  });
});

// Get User Profile
routes.get("/auth/me", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  refreshUserStreaks(user.id);

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    missionStatement: user.missionStatement,
    streak: user.streak,
    longestStreak: user.longestStreak,
    disciplineScore: user.disciplineScore,
    consistencyScore: user.consistencyScore,
    xp: user.xp,
    level: user.level,
    badges: user.badges,
    recoveryTokens: user.recoveryTokens,
    growthTimeline: user.growthTimeline,
    following: user.following,
    followers: user.followers,
  });
});

// Update Profile
routes.put("/auth/profile", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const { bio, missionStatement } = req.body;

  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updatedUsers = [...db.users];
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    bio: bio !== undefined ? bio : updatedUsers[userIndex].bio,
    missionStatement: missionStatement !== undefined ? missionStatement : updatedUsers[userIndex].missionStatement,
  };

  db.users = updatedUsers;

  res.json({
    success: true,
    user: {
      id: db.users[userIndex].id,
      username: db.users[userIndex].username,
      email: db.users[userIndex].email,
      bio: db.users[userIndex].bio,
      missionStatement: db.users[userIndex].missionStatement,
      streak: db.users[userIndex].streak,
      longestStreak: db.users[userIndex].longestStreak,
      disciplineScore: db.users[userIndex].disciplineScore,
      consistencyScore: db.users[userIndex].consistencyScore,
      xp: db.users[userIndex].xp,
      level: db.users[userIndex].level,
      badges: db.users[userIndex].badges,
      recoveryTokens: db.users[userIndex].recoveryTokens,
      growthTimeline: db.users[userIndex].growthTimeline,
    },
  });
});

// Change Password
routes.put("/auth/change-password", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Please enter current and new passwords" });
    return;
  }

  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = db.users[userIndex];
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  const updatedUsers = [...db.users];
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    passwordHash: newHash,
  };
  db.users = updatedUsers;

  res.json({ success: true, message: "Password updated successfully" });
});

// ----------------------------------------------------
// HABIT ENGINE ENDPOINTS
// ----------------------------------------------------

// Get All Habits for User
routes.get("/habits", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const userHabits = db.habits.filter((h) => h.userId === userId);
  res.json(userHabits);
});

// Create Habit
routes.post("/habits", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const { name, category, difficulty, target, frequency, notes, color, icon } = req.body;

  if (!name || !category || !difficulty || !target || !frequency) {
    res.status(400).json({ error: "Missing required habit parameters" });
    return;
  }

  const newHabit = {
    id: generateId(),
    userId: userId,
    name,
    category,
    difficulty,
    target,
    frequency,
    notes: notes || "",
    color: color || "bg-indigo-500",
    icon: icon || "Flame",
    completedDates: [],
    streak: 0,
    longestStreak: 0,
    createdAt: new Date().toISOString(),
  };

  db.habits = [...db.habits, newHabit];
  refreshUserStreaks(userId);

  res.status(201).json(newHabit);
});

// Check-in Habit (Toggle completion for a specific date)
routes.post("/habits/:id/checkin", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const habitId = req.params.id;
  const { date } = req.body;

  const checkinDate = date || getTodayDateStr();

  const habitIndex = db.habits.findIndex((h) => h.id === habitId && h.userId === userId);
  if (habitIndex === -1) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  const habit = db.habits[habitIndex];
  const completedDates = [...habit.completedDates];
  const dateIndex = completedDates.indexOf(checkinDate);

  let isCompletedNow = false;
  let xpAwarded = 0;

  if (dateIndex !== -1) {
    // Un-checkin
    completedDates.splice(dateIndex, 1);
  } else {
    // Check-in
    completedDates.push(checkinDate);
    isCompletedNow = true;

    // Calculate XP based on difficulty
    const baseXP = habit.difficulty === "hard" ? 30 : habit.difficulty === "medium" ? 20 : 10;
    // Add streak bonus
    const streakBonus = Math.min(Math.floor(habit.streak / 5) * 5, 25);
    xpAwarded = baseXP + streakBonus;
  }

  // Update Completed dates
  const updatedHabits = [...db.habits];
  updatedHabits[habitIndex] = {
    ...habit,
    completedDates,
  };

  db.habits = updatedHabits;

  // Re-calculate streaks and scores
  const user = db.users.find((u) => u.id === userId);
  
  // Recalculate this specific habit's streak
  recalculateIndividualHabitStreak(habitId);

  // Re-fetch updated habit
  const refreshedHabit = db.habits.find((h) => h.id === habitId);

  // Refresh user level, scores, and streaks
  let leveledUp = false;

  if (isCompletedNow && xpAwarded > 0) {
    user.xp += xpAwarded;
    user.growthTimeline = [
      {
        date: checkinDate,
        event: `Completed Habit: ${habit.name} (+${xpAwarded} XP)`,
        xpGained: xpAwarded,
      },
      ...user.growthTimeline,
    ];

    // Check level up (every 200 XP = 1 level)
    const newLevel = Math.floor(user.xp / 200) + 1;
    if (newLevel > user.level) {
      leveledUp = true;
      user.level = newLevel;
      user.badges.push({
        id: `level-${newLevel}`,
        name: `Level ${newLevel} Vanguard`,
        description: `Unlocked by forging ${user.xp} XP of disciplined effort.`,
        date: checkinDate,
        icon: "Milestone",
      });

      // Add recovery token as reward
      user.recoveryTokens += 1;

      // System notification
      const levelNotif = {
        id: generateId(),
        userId: user.id,
        text: `Level Up! You are now Level ${newLevel}! Earned +1 Recovery Token.`,
        type: "system",
        isRead: false,
        timestamp: new Date().toISOString(),
      };
      db.notifications = [...db.notifications, levelNotif];

      // Broadcast celebration
      broadcastCelebration({
        username: user.username,
        message: `has reached Level ${newLevel}! Let's celebrate the discipline!`,
        type: "level_up",
      });
    }

    // Share to progress feed
    const post = {
      id: generateId(),
      userId: user.id,
      username: user.username,
      type: "habit_completed",
      content: `completed "${habit.name}" (${habit.target}) - category: ${habit.category}, difficulty: ${habit.difficulty}. Current habit streak is ${refreshedHabit.streak} days!`,
      timestamp: new Date().toISOString(),
      likes: [],
      celebrations: [],
      comments: [],
    };
    db.feedPosts = [post, ...db.feedPosts];
  }

  // Save all score/streak updates
  refreshUserStreaks(userId);

  res.json({
    habit: refreshedHabit,
    xpAwarded,
    leveledUp,
    newLevel: user.level,
  });
});

// Delete Habit
routes.delete("/habits/:id", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const habitId = req.params.id;

  const habitExists = db.habits.some((h) => h.id === habitId && h.userId === userId);
  if (!habitExists) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  db.habits = db.habits.filter((h) => !(h.id === habitId && h.userId === userId));
  refreshUserStreaks(userId);

  res.json({ success: true, message: "Habit deleted" });
});

// ----------------------------------------------------
// CHALLENGE ENDPOINTS
// ----------------------------------------------------

// Create Challenge
routes.post("/challenges", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const { title, description, category, difficulty, durationDays, isPublic } = req.body;

  if (!title || !description || !category || !difficulty || !durationDays) {
    res.status(400).json({ error: "Missing challenge parameters" });
    return;
  }

  const creator = db.users.find((u) => u.id === userId);

  const newChallenge = {
    id: generateId(),
    creatorId: userId,
    creatorName: creator.username,
    title,
    description,
    category,
    difficulty,
    durationDays: parseInt(durationDays),
    startDate: getTodayDateStr(),
    isPublic: isPublic !== undefined ? isPublic : true,
    participants: [
      {
        userId: userId,
        username: creator.username,
        progress: 0,
        completedDates: [],
      },
    ],
    xpReward: parseInt(durationDays) * 15,
    badgeReward: `Challenger: ${title}`,
  };

  db.challenges = [...db.challenges, newChallenge];

  // Post to Feed
  const post = {
    id: generateId(),
    userId: userId,
    username: creator.username,
    type: "challenge_joined",
    content: `created a new challenge: "${title}" - Join now to conquer this ${durationDays}-day task!`,
    timestamp: new Date().toISOString(),
    likes: [],
    celebrations: [],
    comments: [],
  };
  db.feedPosts = [post, ...db.feedPosts];

  res.status(201).json(newChallenge);
});

// Join Challenge
routes.post("/challenges/:id/join", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const challengeId = req.params.id;

  const challengeIndex = db.challenges.findIndex((c) => c.id === challengeId);
  if (challengeIndex === -1) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const challenge = db.challenges[challengeIndex];
  const user = db.users.find((u) => u.id === userId);

  const isAlreadyParticipant = challenge.participants.some((p) => p.userId === userId);
  if (isAlreadyParticipant) {
    res.status(400).json({ error: "You are already in this challenge" });
    return;
  }

  const updatedChallenges = [...db.challenges];
  updatedChallenges[challengeIndex] = {
    ...challenge,
    participants: [
      ...challenge.participants,
      {
        userId: userId,
        username: user.username,
        progress: 0,
        completedDates: [],
      },
    ],
  };

  db.challenges = updatedChallenges;

  // Add notification to challenge creator if joined by someone else
  if (challenge.creatorId !== userId) {
    const creatorNotif = {
      id: generateId(),
      userId: challenge.creatorId,
      text: `${user.username} joined your challenge "${challenge.title}"!`,
      type: "challenge",
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    db.notifications = [...db.notifications, creatorNotif];
    notifyUser(challenge.creatorId, { text: creatorNotif.text, type: "challenge" });
  }

  // Share to progress feed
  const post = {
    id: generateId(),
    userId: user.id,
    username: user.username,
    type: "challenge_joined",
    content: `joined the challenge: "${challenge.title}" with ${challenge.participants.length + 1} other discipline-builders!`,
    timestamp: new Date().toISOString(),
    likes: [],
    celebrations: [],
    comments: [],
  };
  db.feedPosts = [post, ...db.feedPosts];

  res.json(updatedChallenges[challengeIndex]);
});

// Complete Challenge Day check-in
routes.post("/challenges/:id/checkin", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const challengeId = req.params.id;
  const today = getTodayDateStr();

  const challengeIndex = db.challenges.findIndex((c) => c.id === challengeId);
  if (challengeIndex === -1) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const challenge = db.challenges[challengeIndex];
  const participantIndex = challenge.participants.findIndex((p) => p.userId === userId);

  if (participantIndex === -1) {
    res.status(400).json({ error: "You are not a participant in this challenge" });
    return;
  }

  const participant = challenge.participants[participantIndex];
  const completedDates = [...participant.completedDates];

  if (completedDates.includes(today)) {
    res.status(400).json({ error: "Already completed this challenge task for today" });
    return;
  }

  completedDates.push(today);
  const totalDaysNeeded = challenge.durationDays;
  const progress = Math.min(Math.round((completedDates.length / totalDaysNeeded) * 100), 100);

  const updatedParticipants = [...challenge.participants];
  updatedParticipants[participantIndex] = {
    ...participant,
    completedDates,
    progress,
  };

  const updatedChallenges = [...db.challenges];
  updatedChallenges[challengeIndex] = {
    ...challenge,
    participants: updatedParticipants,
  };

  db.challenges = updatedChallenges;

  // If completed challenge
  const user = db.users.find((u) => u.id === userId);
  let didCompleteChallenge = false;

  if (progress === 100 && participant.progress < 100) {
    didCompleteChallenge = true;
    user.xp += challenge.xpReward;
    user.badges.push({
      id: `challenge-${challenge.id}`,
      name: challenge.badgeReward,
      description: `Conquered the ${challenge.durationDays}-day challenge "${challenge.title}".`,
      date: today,
      icon: "Award",
    });

    user.growthTimeline = [
      {
        date: today,
        event: `Conquered challenge: ${challenge.title} (+${challenge.xpReward} XP)`,
        xpGained: challenge.xpReward,
      },
      ...user.growthTimeline,
    ];

    // Send complete notification
    const compNotif = {
      id: generateId(),
      userId: user.id,
      text: `Congratulations! You conquered the challenge "${challenge.title}"! Awarded "${challenge.badgeReward}" badge and +${challenge.xpReward} XP!`,
      type: "challenge",
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    db.notifications = [...db.notifications, compNotif];

    // Share completion to feed
    const post = {
      id: generateId(),
      userId: user.id,
      username: user.username,
      type: "challenge_completed",
      content: `conquered the challenge "${challenge.title}" after successfully finishing all ${challenge.durationDays} tasks! Earned the badge "${challenge.badgeReward}"!`,
      timestamp: new Date().toISOString(),
      likes: [],
      celebrations: [],
      comments: [],
    };
    db.feedPosts = [post, ...db.feedPosts];

    // Broadcast celebration
    broadcastCelebration({
      username: user.username,
      message: `has completed the challenge: "${challenge.title}"! Absolute machine!`,
      type: "challenge_completed",
    });
  }

  refreshUserStreaks(userId);

  res.json({
    challenge: updatedChallenges[challengeIndex],
    completedCount: completedDates.length,
    didCompleteChallenge,
    xpReward: didCompleteChallenge ? challenge.xpReward : 0,
  });
});

// Get Challenges
routes.get("/challenges", authenticateToken, (req, res) => {
  res.json(db.challenges);
});

// ----------------------------------------------------
// ACCOUNTABILITY CIRCLES ENDPOINTS
// ----------------------------------------------------

// Get Circles
routes.get("/circles", authenticateToken, (req, res) => {
  res.json(db.circles);
});

// Create Circle
routes.post("/circles", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const { name, description } = req.body;

  if (!name || !description) {
    res.status(400).json({ error: "Missing circle name or description" });
    return;
  }

  const creator = db.users.find((u) => u.id === userId);

  const newCircle = {
    id: generateId(),
    name,
    description,
    creatorId: userId,
    members: [
      {
        userId: userId,
        username: creator.username,
        disciplineScore: creator.disciplineScore,
      },
    ],
    messages: [
      {
        id: generateId(),
        userId: "system",
        username: "Forge Guide",
        text: `Welcome to the ${name} Accountability Circle! Keep each other focused and consistent.`,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.circles = [...db.circles, newCircle];
  res.status(201).json(newCircle);
});

// Join Circle
routes.post("/circles/:id/join", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const circleId = req.params.id;

  const circleIndex = db.circles.findIndex((c) => c.id === circleId);
  if (circleIndex === -1) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  const circle = db.circles[circleIndex];
  const user = db.users.find((u) => u.id === userId);

  if (circle.members.some((m) => m.userId === userId)) {
    res.status(400).json({ error: "Already a member of this circle" });
    return;
  }

  const systemMessage = {
    id: generateId(),
    userId: "system",
    username: "Forge Guide",
    text: `${user.username} has joined the circle. Welcome!`,
    timestamp: new Date().toISOString(),
  };

  const updatedCircles = [...db.circles];
  updatedCircles[circleIndex] = {
    ...circle,
    members: [
      ...circle.members,
      {
        userId: userId,
        username: user.username,
        disciplineScore: user.disciplineScore,
      },
    ],
    messages: [...circle.messages, systemMessage],
  };

  db.circles = updatedCircles;

  // Broadcast system message to room
  broadcastCircleMessage(circleId, systemMessage);

  res.json(updatedCircles[circleIndex]);
});

// Post Circle Chat Message
routes.post("/circles/:id/messages", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const circleId = req.params.id;
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ error: "Message content required" });
    return;
  }

  const circleIndex = db.circles.findIndex((c) => c.id === circleId);
  if (circleIndex === -1) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  const circle = db.circles[circleIndex];
  if (!circle.members.some((m) => m.userId === userId)) {
    res.status(403).json({ error: "You are not a member of this circle" });
    return;
  }

  const user = db.users.find((u) => u.id === userId);

  const newMessage = {
    id: generateId(),
    userId: userId,
    username: user.username,
    text,
    timestamp: new Date().toISOString(),
  };

  const updatedCircles = [...db.circles];
  updatedCircles[circleIndex] = {
    ...circle,
    messages: [...circle.messages, newMessage],
  };

  db.circles = updatedCircles;

  // Broadcast to other sockets
  broadcastCircleMessage(circleId, newMessage);

  res.json(newMessage);
});

// ----------------------------------------------------
// PROGRESS FEED ENDPOINTS
// ----------------------------------------------------

// Get Feed Posts
routes.get("/feed", authenticateToken, (req, res) => {
  res.json(db.feedPosts);
});

// Create Feed Post (Reflection/Summary)
routes.post("/feed", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: "Content is required to share reflection" });
    return;
  }

  const user = db.users.find((u) => u.id === userId);

  const newPost = {
    id: generateId(),
    userId: userId,
    username: user.username,
    type: "reflection",
    content,
    timestamp: new Date().toISOString(),
    likes: [],
    celebrations: [],
    comments: [],
  };

  db.feedPosts = [newPost, ...db.feedPosts];
  res.status(201).json(newPost);
});

// Like/Un-like Post
routes.post("/feed/:id/like", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const postId = req.params.id;

  const postIndex = db.feedPosts.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const post = db.feedPosts[postIndex];
  const likes = [...post.likes];
  const idx = likes.indexOf(userId);

  if (idx !== -1) {
    likes.splice(idx, 1);
  } else {
    likes.push(userId);
    // Send social notification
    if (post.userId !== userId) {
      const creatorNotif = {
        id: generateId(),
        userId: post.userId,
        text: `${req.user?.username} liked your progress post.`,
        type: "social",
        isRead: false,
        timestamp: new Date().toISOString(),
      };
      db.notifications = [...db.notifications, creatorNotif];
      notifyUser(post.userId, { text: creatorNotif.text, type: "social" });
    }
  }

  const updatedPosts = [...db.feedPosts];
  updatedPosts[postIndex] = { ...post, likes };
  db.feedPosts = updatedPosts;

  res.json(updatedPosts[postIndex]);
});

// Add Celebration/Reaction
routes.post("/feed/:id/celebrate", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const postId = req.params.id;
  const { type } = req.body;

  if (!["fire", "clap", "salute"].includes(type)) {
    res.status(400).json({ error: "Invalid reaction type" });
    return;
  }

  const postIndex = db.feedPosts.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const post = db.feedPosts[postIndex];
  const celebrations = [...post.celebrations];
  const existingIdx = celebrations.findIndex((c) => c.userId === userId);

  if (existingIdx !== -1) {
    celebrations[existingIdx] = { userId: userId, type };
  } else {
    celebrations.push({ userId: userId, type });

    // Send notifications
    if (post.userId !== userId) {
      const creatorNotif = {
        id: generateId(),
        userId: post.userId,
        text: `${req.user?.username} cheered you on with a ${type}!`,
        type: "social",
        isRead: false,
        timestamp: new Date().toISOString(),
      };
      db.notifications = [...db.notifications, creatorNotif];
      notifyUser(post.userId, { text: creatorNotif.text, type: "social" });
    }
  }

  const updatedPosts = [...db.feedPosts];
  updatedPosts[postIndex] = { ...post, celebrations };
  db.feedPosts = updatedPosts;

  res.json(updatedPosts[postIndex]);
});

// Comment on Post
routes.post("/feed/:id/comments", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const postId = req.params.id;
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ error: "Comment text is required" });
    return;
  }

  const postIndex = db.feedPosts.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const post = db.feedPosts[postIndex];
  const newComment = {
    id: generateId(),
    userId: userId,
    username: req.user?.username,
    text,
    timestamp: new Date().toISOString(),
  };

  const updatedPosts = [...db.feedPosts];
  updatedPosts[postIndex] = {
    ...post,
    comments: [...post.comments, newComment],
  };
  db.feedPosts = updatedPosts;

  // Send comment notification
  if (post.userId !== userId) {
    const creatorNotif = {
      id: generateId(),
      userId: post.userId,
      text: `${req.user?.username} commented on your progress post: "${text.substring(0, 20)}..."`,
      type: "social",
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    db.notifications = [...db.notifications, creatorNotif];
    notifyUser(post.userId, { text: creatorNotif.text, type: "social" });
  }

  res.json(newComment);
});

// ----------------------------------------------------
// NOTIFICATION ENDPOINTS
// ----------------------------------------------------

routes.get("/notifications", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const userNotifs = db.notifications.filter((n) => n.userId === userId).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  res.json(userNotifs);
});

routes.put("/notifications/read", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  db.notifications = db.notifications.map((n) => {
    if (n.userId === userId) {
      return { ...n, isRead: true };
    }
    return n;
  });
  res.json({ success: true });
});

// ----------------------------------------------------
// LEADERBOARDS & SOCIAL CONNECTIONS
// ----------------------------------------------------

routes.get("/leaderboard", authenticateToken, (req, res) => {
  // Sort users based on disciplineScore (primary) and streak (secondary)
  const rankedUsers = [...db.users]
    .sort((a, b) => {
      if (b.disciplineScore !== a.disciplineScore) {
        return b.disciplineScore - a.disciplineScore;
      }
      return b.streak - a.streak;
    })
    .map((u, index) => ({
      rank: index + 1,
      id: u.id,
      username: u.username,
      disciplineScore: u.disciplineScore,
      streak: u.streak,
      level: u.level,
      xp: u.xp,
    }));

  res.json(rankedUsers);
});

routes.post("/social/follow/:targetId", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  const targetId = req.params.targetId;

  if (userId === targetId) {
    res.status(400).json({ error: "You cannot follow yourself" });
    return;
  }

  const userIndex = db.users.findIndex((u) => u.id === userId);
  const targetIndex = db.users.findIndex((u) => u.id === targetId);

  if (userIndex === -1 || targetIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = db.users[userIndex];
  const target = db.users[targetIndex];

  let isFollowingNow = false;
  const following = [...user.following];
  const targetFollowers = [...target.followers];

  const idx = following.indexOf(targetId);
  if (idx !== -1) {
    // Unfollow
    following.splice(idx, 1);
    const fIdx = targetFollowers.indexOf(userId);
    if (fIdx !== -1) targetFollowers.splice(fIdx, 1);
  } else {
    // Follow
    following.push(targetId);
    targetFollowers.push(userId);
    isFollowingNow = true;

    // Send notifications
    const targetNotif = {
      id: generateId(),
      userId: targetId,
      text: `${user.username} started following you on Forge!`,
      type: "social",
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    db.notifications = [...db.notifications, targetNotif];
    notifyUser(targetId, { text: targetNotif.text, type: "social" });
  }

  const updatedUsers = [...db.users];
  updatedUsers[userIndex] = { ...user, following };
  updatedUsers[targetIndex] = { ...target, followers: targetFollowers };
  db.users = updatedUsers;

  res.json({ isFollowing: isFollowingNow, followingCount: following.length });
});

routes.get("/users/search", authenticateToken, (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  if (!q) {
    res.json([]);
    return;
  }

  const results = db.users
    .filter((u) => u.username.toLowerCase().includes(q))
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      username: u.username,
      bio: u.bio,
      level: u.level,
      streak: u.streak,
      disciplineScore: u.disciplineScore,
    }));

  res.json(results);
});


// ----------------------------------------------------
// REFRESH & CALCULATION ENGINE (STREAK, DISCIPLINE, etc.)
// ----------------------------------------------------

export function recalculateIndividualHabitStreak(habitId) {
  const habitIndex = db.habits.findIndex((h) => h.id === habitId);
  if (habitIndex === -1) return;

  const habit = db.habits[habitIndex];
  const completed = [...habit.completedDates].sort();
  if (completed.length === 0) {
    habit.streak = 0;
    saveDB();
    return;
  }

  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  let streak = 0;
  let isAlive = completed.includes(todayStr) || completed.includes(yesterdayStr);

  if (isAlive) {
    // Walk back day by day
    let checkDate = new Date();
    // Start count from the last completed date that is either today or yesterday
    if (!completed.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateString = checkDate.toISOString().split("T")[0];
      if (completed.includes(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  habit.streak = streak;
  habit.longestStreak = Math.max(habit.longestStreak || 0, streak);

  const updatedHabits = [...db.habits];
  updatedHabits[habitIndex] = habit;
  db.habits = updatedHabits;
}

export function refreshUserStreaks(userId) {
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return;

  const user = db.users[userIndex];
  const userHabits = db.habits.filter((h) => h.userId === userId);

  // Recalculate streaks for each habit first
  userHabits.forEach((h) => recalculateIndividualHabitStreak(h.id));

  // Determine active checkin days for user overall
  // A day is "active" if user checked off at least 1 habit on that day
  const activeDaysSet = new Set();
  userHabits.forEach((h) => {
    h.completedDates.forEach((d) => activeDaysSet.add(d));
  });

  const sortedActiveDays = Array.from(activeDaysSet).sort();
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  let currentStreak = 0;
  let isStreakAlive = sortedActiveDays.includes(todayStr) || sortedActiveDays.includes(yesterdayStr);

  if (isStreakAlive) {
    let checkDate = new Date();
    if (!sortedActiveDays.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateString = checkDate.toISOString().split("T")[0];
      if (sortedActiveDays.includes(dateString)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    // If streak has died today, check if they have a Recovery Token to prevent streak reset
    if (user.streak > 0 && user.recoveryTokens > 0) {
      user.recoveryTokens -= 1;
      currentStreak = user.streak; // Retain current streak
      
      // Push notification
      const recNotif = {
        id: generateId(),
        userId: user.id,
        text: `Recovery Token used automatically to protect your ${user.streak}-day streak! Keep going!`,
        type: "system",
        isRead: false,
        timestamp: new Date().toISOString(),
      };
      db.notifications = [...db.notifications, recNotif];
      
      // Timeline event
      user.growthTimeline = [
        {
          date: todayStr,
          event: `Protected ${currentStreak}-day streak using Recovery Token`,
          xpGained: 0,
        },
        ...user.growthTimeline,
      ];
    }
  }

  user.streak = currentStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, currentStreak);

  // ----------------------------------------------------
  // CALCULATE DISCIPLINE SCORE (Last 7 days completion rate)
  // ----------------------------------------------------
  let totalHabitInstances = 0;
  let totalCompletions = 0;

  const past7Days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    past7Days.push(d.toISOString().split("T")[0]);
  }

  userHabits.forEach((habit) => {
    past7Days.forEach((dateStr) => {
      totalHabitInstances += 1;
      if (habit.completedDates.includes(dateStr)) {
        totalCompletions += 1;
      }
    });
  });

  const disciplineScore = totalHabitInstances > 0 
    ? Math.round((totalCompletions / totalHabitInstances) * 100) 
    : 100;

  user.disciplineScore = Math.max(Math.min(disciplineScore, 100), 0);

  // ----------------------------------------------------
  // CALCULATE CONSISTENCY SCORE (Long-term habit completion)
  // ----------------------------------------------------
  const daysSinceCreation = Math.max(
    1,
    Math.ceil((Date.now() - new Date(user.createdAt || todayStr).getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalPossibleCompletions = Math.max(1, userHabits.length * Math.min(daysSinceCreation, 30));
  let actualCompletions = 0;
  
  // Look back max 30 days
  const past30Days = [];
  for (let i = 0; i < Math.min(daysSinceCreation, 30); i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    past30Days.push(d.toISOString().split("T")[0]);
  }

  userHabits.forEach((habit) => {
    past30Days.forEach((dateStr) => {
      if (habit.completedDates.includes(dateStr)) {
        actualCompletions += 1;
      }
    });
  });

  user.consistencyScore = Math.min(Math.round((actualCompletions / totalPossibleCompletions) * 100), 100);

  // ----------------------------------------------------
  // POPULATE DAY HISTORY (Used for Heatmap)
  // ----------------------------------------------------
  const history = [];
  past30Days.forEach((dateStr) => {
    let completedCount = 0;
    let totalCount = userHabits.length;

    userHabits.forEach((habit) => {
      if (habit.completedDates.includes(dateStr)) {
        completedCount++;
      }
    });

    let status = "missed";
    if (totalCount > 0) {
      if (completedCount === totalCount) status = "perfect";
      else if (completedCount > 0) status = "partial";
    }

    history.push({
      date: dateStr,
      completedCount,
      totalCount,
      status,
    });
  });

  user.history = history.reverse(); // ascending order of dates for calendar charts

  // Check and award Milestone Badges
  checkBadgeMilestones(user);

  // Save the database
  const updatedUsers = [...db.users];
  updatedUsers[userIndex] = user;
  db.users = updatedUsers;
}

function checkBadgeMilestones(user) {
  const currentBadgeIds = user.badges.map((b) => b.id);
  const today = getTodayDateStr();

  // Streak Badges
  if (user.streak >= 3 && !currentBadgeIds.includes("streak-3")) {
    user.badges.push({
      id: "streak-3",
      name: "3-Day Dynamo",
      description: "Forged a perfect 3-day consistency streak.",
      date: today,
      icon: "Zap",
    });
    user.xp += 30;
  }
  if (user.streak >= 7 && !currentBadgeIds.includes("streak-7")) {
    user.badges.push({
      id: "streak-7",
      name: "Week of Iron",
      description: "Forged a perfect 7-day consistency streak.",
      date: today,
      icon: "Flame",
    });
    user.xp += 50;
  }
  if (user.streak >= 30 && !currentBadgeIds.includes("streak-30")) {
    user.badges.push({
      id: "streak-30",
      name: "Unstoppable Force",
      description: "Maintained complete commitment for 30 consecutive days.",
      date: today,
      icon: "Compass",
    });
    user.xp += 150;
  }

  // Discipline Score Badges
  if (user.disciplineScore >= 95 && db.habits.filter(h => h.userId === user.id).length >= 3 && !currentBadgeIds.includes("discipline-elite")) {
    user.badges.push({
      id: "discipline-elite",
      name: "Elite Zealot",
      description: "Attained greater than 95% Discipline Score with at least 3 active habits.",
      date: today,
      icon: "Crown",
    });
    user.xp += 100;
  }
}
