# 🧠 EchoMind — 100% Free Setup Guide

> Powered by **Groq (Llama 3.3 70B)** + **MongoDB Atlas** — zero cost, no credit card needed.

---

## 💰 Cost Breakdown

| Service | Cost | Limit |
|---|---|---|
| MongoDB Atlas | **FREE** | 512 MB storage |
| Groq API | **FREE** | ~14,400 requests/day |
| Hosting (local) | **FREE** | Runs on your machine |

**Total: $0.00**

---

## 🧱 What Changed vs the OpenAI version

- ❌ Removed: OpenAI API (paid)
- ❌ Removed: Pinecone (replaced entirely)
- ✅ Added: **Groq SDK** — free Llama 3.3 70B
- ✅ Added: **BM25 keyword search** stored in MongoDB — no vector DB needed at all
- Everything else (auth, file upload, conversations) stays the same

---

## ⚙️ Step-by-Step Setup

### STEP 1 — Install Node.js (if you don't have it)

Go to https://nodejs.org → download the **LTS** version → install it.

Verify it works:
```bash
node --version   # should show v18 or higher
npm --version
```

---

### STEP 2 — Set up MongoDB Atlas (free cloud database)

**2a.** Go to → https://www.mongodb.com/atlas
Click **"Try Free"** → sign up with Google or email (no credit card needed)

**2b.** After signing in, click **"Build a Database"**
- Choose **M0 FREE** (the free tier)
- Pick any cloud region (e.g. AWS → N. Virginia)
- Click **"Create"**

**2c.** Create a database user:
- Username: `echomind_user`
- Password: click **"Autogenerate Secure Password"** → **copy it and save it**
- Click **"Create User"**

**2d.** Set up network access:
- Under "Where would you like to connect from?" choose **"My Local Environment"**
- Click **"Add My Current IP Address"**
- Click **"Finish and Close"**

**2e.** Get your connection string:
- On the Atlas dashboard, click **"Connect"** on your cluster
- Choose **"Drivers"**
- Select **Node.js**, version **5.5 or later**
- Copy the connection string — it looks like:
  ```
  mongodb+srv://echomind_user:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
  ```
- Replace `<password>` with the password you saved in step 2c
- Add `/echomind` before the `?` so it becomes:
  ```
  mongodb+srv://echomind_user:YOURPASSWORD@cluster0.abc123.mongodb.net/echomind?retryWrites=true&w=majority
  ```
- **This is your MONGO_URI** — save it

---

### STEP 3 — Get your free Groq API key

**3a.** Go to → https://console.groq.com
Click **"Sign Up"** → use Google or GitHub (free, no credit card)

**3b.** Once logged in, click **"API Keys"** in the left sidebar

**3c.** Click **"Create API Key"**
- Name it "echomind"
- Copy the key (starts with `gsk_...`)
- **This is your GROQ_API_KEY** — save it

---

### STEP 4 — Configure the app

Open your terminal, go into the project folder:

```bash
cd echomind-free/server
cp .env.example .env
```

Open `server/.env` in any text editor (Notepad, VS Code, etc.) and fill in:

```env
MONGO_URI=mongodb+srv://echomind_user:YOURPASSWORD@cluster0.abc123.mongodb.net/echomind?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_you_make_up_like_abc123xyz789
GROQ_API_KEY=gsk_your_groq_key_here
PORT=5000
NODE_ENV=development
```

Save the file.

---

### STEP 5 — Install dependencies and run

```bash
# From the echomind-free root folder:
npm run install-all

# Then start both server + client:
npm run dev
```

You should see:
```
🧠 EchoMind server running on http://localhost:5000
✅ MongoDB connected: cluster0.abc123.mongodb.net
```

Open your browser → http://localhost:3000

---

## 🧠 How It Works (Free Version)

```
You upload a PDF
     ↓
Server extracts text (pdf-parse — free library)
     ↓
Text split into ~800 character chunks
     ↓
Each chunk: compute BM25 keyword term frequencies
     ↓
Stored directly in MongoDB (no Pinecone needed!)
     ↓
You ask a question
     ↓
BM25 search scores all chunks against your query
     ↓
Top 5 most relevant chunks selected
     ↓
Sent to Groq → Llama 3.3 70B (free)
     ↓
AI responds with source citations [Doc: "filename"]
     ↓
Conversation saved in MongoDB
```

---

## ❓ Troubleshooting

**"MongoServerError: bad auth"**
→ Wrong password in MONGO_URI. Re-check step 2c.

**"Network timeout" connecting to Atlas**
→ Your IP wasn't whitelisted. Go to Atlas → Network Access → Add IP Address → add your current IP.

**"Invalid API Key" from Groq**
→ Check GROQ_API_KEY in .env starts with `gsk_` and has no spaces.

**Port 3000 or 5000 already in use**
→ Change PORT in .env (e.g. to 5001) and update client/package.json proxy to match.

**Upload stuck on "Processing"**
→ Check server terminal for errors. Most common cause: corrupted PDF. Try a plain .txt file first.

---

## 🚢 Free Deployment (Optional)

To get a live URL you can send to recruiters:

**Backend → Railway (free tier)**
1. Push server/ folder to a GitHub repo
2. Go to railway.app → New Project → Deploy from GitHub
3. Add all your .env variables in Railway's "Variables" tab
4. Done — Railway gives you a free URL

**Frontend → Vercel (free)**
1. Push client/ folder to GitHub
2. Go to vercel.com → Import project
3. Set REACT_APP_API_URL to your Railway URL
4. Done — you get a free .vercel.app URL
