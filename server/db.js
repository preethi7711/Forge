import fs from "fs";
import path from "path";

// Define the database file path
const DB_FILE = path.join(process.cwd(), "forge_db.json");

// In-memory cache
let dbCache = {
  users: [],
  habits: [],
  challenges: [],
  circles: [],
  feedPosts: [],
  notifications: [],
};

// Initialize DB file if not exists
export function initDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      dbCache = JSON.parse(raw);
    } else {
      saveDB();
    }
  } catch (error) {
    console.error("Error reading database file, resetting...", error);
    saveDB();
  }
}

// Write to disk
export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Helper methods to access collections
export const db = {
  get users() {
    return dbCache.users;
  },
  set users(val) {
    dbCache.users = val;
    saveDB();
  },

  get habits() {
    return dbCache.habits;
  },
  set habits(val) {
    dbCache.habits = val;
    saveDB();
  },

  get challenges() {
    return dbCache.challenges;
  },
  set challenges(val) {
    dbCache.challenges = val;
    saveDB();
  },

  get circles() {
    return dbCache.circles;
  },
  set circles(val) {
    dbCache.circles = val;
    saveDB();
  },

  get feedPosts() {
    return dbCache.feedPosts;
  },
  set feedPosts(val) {
    dbCache.feedPosts = val;
    saveDB();
  },

  get notifications() {
    return dbCache.notifications;
  },
  set notifications(val) {
    dbCache.notifications = val;
    saveDB();
  },
};
