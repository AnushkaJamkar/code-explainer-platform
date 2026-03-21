const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const CodeHistory = require("../models/CodeHistory");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "dev-db.json");

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify({ users: [], history: [] }, null, 2),
      "utf8"
    );
  }
}

function readStore() {
  ensureStoreFile();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeStore(store) {
  ensureStoreFile();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function findUserByEmail(email) {
  if (isDatabaseReady()) {
    return User.findOne({ email });
  }

  const store = readStore();
  return store.users.find((user) => user.email === email) || null;
}

async function createUserRecord({ name, email, password }) {
  if (isDatabaseReady()) {
    return User.create({ name, email, password });
  }

  const store = readStore();
  const user = {
    _id: crypto.randomUUID(),
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.users.push(user);
  writeStore(store);

  return user;
}

async function createHistoryRecord({
  user,
  code,
  language,
  metrics,
  smells,
  flowNodes,
  aiSuggestions
}) {
  if (isDatabaseReady()) {
    return CodeHistory.create({
      user,
      code,
      language,
      metrics,
      smells,
      flowNodes,
      aiSuggestions
    });
  }

  const store = readStore();
  const entry = {
    _id: crypto.randomUUID(),
    user,
    code,
    language,
    metrics,
    smells,
    flowNodes,
    aiSuggestions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.history.push(entry);
  writeStore(store);

  return entry;
}

async function getHistoryForUser(userId) {
  if (isDatabaseReady()) {
    return CodeHistory.find({ user: userId }).sort({ createdAt: -1 });
  }

  const store = readStore();
  return store.history
    .filter((entry) => entry.user === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  isDatabaseReady,
  findUserByEmail,
  createUserRecord,
  createHistoryRecord,
  getHistoryForUser
};
