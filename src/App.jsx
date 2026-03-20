import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ============ SUPABASE CLIENT ============

const supabase = createClient(
  "https://iwzuvfaunhfcadqwiqpf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3enV2ZmF1bmhmY2FkcXdpcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDcyNDEsImV4cCI6MjA4OTMyMzI0MX0.lN5a3sPM4dBBGCCFGv1JqRQ-iQlqW5y1iqBizK7OKx0"
);

// ============ CONSTANTS ============

const MODES = {
  full: {
    label: "Full Day",
    color: "#4ADE80",
    bg: "#0A2E1A",
    emoji: "🟢",
    desc: "You're in good shape. Make the most of today.",
    focus: "Good day to tackle what matters. Make decisions with confidence.",
  },
  light: {
    label: "Light Day",
    color: "#FBBF24",
    bg: "#2E2A0A",
    emoji: "🟡",
    desc: "Tools are available, but pay extra attention to warnings.",
    focus: "Protect your energy. Use Decision Gate before any emotional or expensive choice.",
  },
  survival: {
    label: "Survival Day",
    color: "#F87171",
    bg: "#2E0A0A",
    emoji: "🔴",
    desc: "Protect yourself. No big decisions today.",
    focus: "Delay anything that can wait. Keep it simple. You'll have better days for big calls.",
  },
};

const DECISION_TYPES = [
  { id: "commit", icon: "🗣️", label: "Saying 'Yes' to a new commitment" },
  { id: "quit", icon: "🛑", label: "Quitting or backing out of something" },
  { id: "message", icon: "🔥", label: "Sending an emotional message" },
  { id: "life", icon: "🔄", label: "A major life change (move, job, etc.)" },
  { id: "money", icon: "💸", label: "A big financial move" },
  { id: "custom", icon: "✍️", label: "Let me type it out..." },
];

const GROUNDING_QUESTIONS = [
  {
    q: "How fast is your brain moving right now?",
    options: [
      { label: "Normal walking pace (I've been chewing on this)", flags: 0, color: "#4ADE80", bg: "#0A2E1A" },
      { label: "100 miles per hour (I need this resolved *now*)", flags: 1, color: "#F87171", bg: "#2E0A0A" }
    ]
  },
  {
    q: "Is your body physically taken care of right now?",
    options: [
      { label: "Yes, I'm fed, rested, and comfortable", flags: 0, color: "#4ADE80", bg: "#0A2E1A" },
      { label: "Honestly? I'm running on empty or overstimulated", flags: 1, color: "#F87171", bg: "#2E0A0A" }
    ]
  },
  {
    q: "What actually happens if you don't decide this until tomorrow?",
    options: [
      { label: "Actual disaster (missed hard deadline, safety)", flags: 0, color: "#4ADE80", bg: "#0A2E1A" },
      { label: "Someone might get annoyed with me", flags: 1, color: "#FBBF24", bg: "#2E2A0A" },
      { label: "Nothing real, I just want the pressure out of my head", flags: 1, color: "#F87171", bg: "#2E0A0A" }
    ]
  }
];

const TRANSITIONS = {
  "Morning → Work": [
    "Close personal tabs and apps",
    "Get water or coffee",
    "Look at your top 3 tasks for today",
    "Pick the ONE thing to start with",
    "Set a 25-minute focus block",
  ],
  "Work → Midday Break": [
    "Save your work and close intense tabs",
    "Stand up and stretch for 60 seconds",
    "Eat something — even if it's small",
    "Step outside or look out a window",
    "Check: how's your energy right now?",
  ],
  "Midday → Afternoon": [
    "Review what you finished this morning",
    "Pick your top priority for the afternoon",
    "Refill water",
    "Put phone on Do Not Disturb if needed",
    "Start with the easiest task to build momentum",
  ],
  "Work → Evening": [
    "Write down where you left off (30 seconds)",
    "Close all work tabs and apps",
    "Change clothes or wash your face",
    "Take 5 slow breaths",
    "You're done working — give yourself permission",
  ],
  "Hyperfocus → Done": [
    "Save your work right now",
    "Stand up and move your body",
    "Drink water — you probably forgot",
    "Check the time — how long were you in?",
    "Do one easy unrelated task to shift gears",
  ],
  "Overwhelm → Reset": [
    "Stop what you're doing",
    "Name one thing you're feeling out loud",
    "Take 5 slow breaths",
    "Pick the smallest possible next step",
    "Just do that one thing — nothing else",
  ],
  "Task → Rest": [
    "Finish your current thought and save",
    "Close the tabs and apps",
    "Put your phone across the room",
    "Do something with your hands or body",
    "Give yourself 15 real minutes off",
  ],
};

const NEXT_ACTIONS_STOP = [
  "Write down the decision and what you're feeling right now. Revisit it tomorrow.",
  "Set a reminder for tomorrow morning to reconsider this with fresh eyes.",
  "Talk to one person you trust about this before deciding.",
  "Sleep on it. If it still feels urgent tomorrow, it probably is.",
  "Ask yourself: what's the smallest reversible step I could take instead?",
];

const NEXT_ACTIONS_GO = [
  "Write down your decision and your top reason. Commit to it.",
  "Set a deadline for acting on this — don't let it drift.",
  "Tell one person what you've decided. Saying it out loud makes it real.",
];

function timeRemaining(expiry) {
  const now = Date.now();
  const diff = expiry - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return Math.floor(hours / 24) + "d " + (hours % 24) + "h";
  return hours + "h " + mins + "m";
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ============ AUTH SCREEN ============

function AuthScreen({ onAuth, onLegal }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session) onAuth(data.session);
        else setConfirmSent(true);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuth(data.session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>📧</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 12 }}>Check your email</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>
          We sent a confirmation link to <strong style={{ color: "#E2E8F0" }}>{email}</strong>. Click it to activate your account, then come back and log in.
        </p>
        <button onClick={() => { setConfirmSent(false); setIsSignUp(false); }} style={primaryBtn}>
          Back to login →
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9" />
        </svg>
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: "#F1F5F9", textAlign: "center", marginBottom: 12 }}>Decision Gate</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E2E8F0", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 8 }}>
        Learn when you make your best and worst decisions — and protect yourself on the bad days.
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 300, lineHeight: 1.5, marginBottom: 28 }}>
        {isSignUp ? "Create a free account to start tracking your decisions." : "Welcome back. Log in to pick up where you left off."}
      </p>
      {error && (
        <div style={{ background: "#2E0A0A", border: "1px solid #F8717140", borderRadius: 12, padding: "10px 16px", marginBottom: 20, maxWidth: 320, width: "100%" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F87171", margin: 0, textAlign: "center" }}>{error}</p>
        </div>
      )}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ ...inputStyle, marginBottom: 12 }} autoFocus />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inputStyle} onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }} />
      <button onClick={handleSubmit} disabled={loading || !email || !password} style={{ ...primaryBtn, marginTop: 24, opacity: (loading || !email || !password) ? 0.5 : 1 }}>
        {loading ? "..." : isSignUp ? "Create account →" : "Log in →"}
      </button>
      <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} style={{ marginTop: 16, background: "none", border: "none", color: "#6366F1", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", padding: "8px" }}>
        {isSignUp ? "Already have an account? Log in" : "New here? Create an account"}
      </button>
      <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <button onClick={() => onLegal("privacy")} style={{ background: "none", border: "none", color: "#334155", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
          Privacy Policy
        </button>
        <button onClick={() => onLegal("terms")} style={{ background: "none", border: "none", color: "#334155", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
          Terms of Service
        </button>
      </div>
    </div>
  );
}

// ============ LOADING SCREEN ============

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9" />
        </svg>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#64748B" }}>Loading your data...</p>
    </div>
  );
}

// ============ PRIVACY POLICY ============

function PrivacyPolicy({ onBack }) {
  const s = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: "0 0 16px" };
  const h = { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: "#E2E8F0", margin: "24px 0 8px" };
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: "#F1F5F9", marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ ...s, color: "#64748B", marginBottom: 24 }}>Last updated: March 17, 2026</p>

      <h2 style={h}>What Decision Gate is</h2>
      <p style={s}>Decision Gate is a daily decision-support tool that helps you check your mental capacity and protect yourself from impulsive decisions. It is not medical software, therapy, or financial advice.</p>

      <h2 style={h}>What we collect</h2>
      <p style={s}>When you create an account, we collect your email address and a password (which is encrypted — we never see it). When you use the app, we store the data you enter: daily check-in answers (sleep, energy, stress, emotion), spend check entries (item name, amount, need/want, decision), decision gate entries (decision text, result), and pending wait timers.</p>

      <h2 style={h}>What we don't collect</h2>
      <p style={s}>We do not collect your real name, location, financial account information, health records, or any data from other apps on your device. We do not use cookies for tracking or advertising.</p>

      <h2 style={h}>How we use your data</h2>
      <p style={s}>Your data is used only to power the app for you — showing your dashboard, saving your decisions, and (in the future) surfacing personal patterns. We do not sell, share, or give your data to anyone. We do not use your data for advertising.</p>

      <h2 style={h}>Where your data is stored</h2>
      <p style={s}>Your data is stored securely on Supabase, a cloud database provider hosted in the United States. Data is transmitted over encrypted connections (HTTPS). Your password is hashed and cannot be read by us or anyone else.</p>

      <h2 style={h}>Deleting your data</h2>
      <p style={s}>You can request deletion of your account and all associated data at any time by emailing us. We will delete everything within 30 days of your request.</p>

      <h2 style={h}>Changes to this policy</h2>
      <p style={s}>If we make changes, we'll update the date at the top. For significant changes, we'll notify you by email.</p>

      <h2 style={h}>Contact</h2>
      <p style={s}>Questions about your data? Email us at support@decisiongate.app.</p>

      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12, marginBottom: 32 }}>← Back</button>
    </div>
  );
}

// ============ TERMS OF SERVICE ============

function TermsOfService({ onBack }) {
  const s = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: "0 0 16px" };
  const h = { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: "#E2E8F0", margin: "24px 0 8px" };
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: "#F1F5F9", marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ ...s, color: "#64748B", marginBottom: 24 }}>Last updated: March 17, 2026</p>

      <h2 style={h}>What you're agreeing to</h2>
      <p style={s}>By creating an account and using Decision Gate, you agree to these terms. If you don't agree, don't use the app. It's that simple.</p>

      <h2 style={h}>What this app is — and isn't</h2>
      <p style={s}>Decision Gate is a self-management tool. It helps you pause and reflect before making decisions. It is not medical advice, mental health treatment, therapy, or financial advice. It does not diagnose any condition. If you are in crisis, please contact a mental health professional or call 988 (Suicide and Crisis Lifeline).</p>

      <h2 style={h}>Your decisions are yours</h2>
      <p style={s}>The app provides prompts, timers, and suggestions. You make all final decisions. We are not responsible for any outcomes — financial, personal, or otherwise — that result from decisions you make while using or not using the app.</p>

      <h2 style={h}>Your account</h2>
      <p style={s}>You're responsible for keeping your login credentials secure. One account per person. Don't share accounts. We can suspend accounts that are used to abuse the service.</p>

      <h2 style={h}>The free tier</h2>
      <p style={s}>Decision Gate is currently free. We plan to add a paid tier in the future. If we do, existing features you're using will continue to work — we won't take away what you already have without notice.</p>

      <h2 style={h}>Availability</h2>
      <p style={s}>We do our best to keep the app running, but we can't guarantee 100% uptime. We're not liable for data loss, downtime, or interruptions. Back up anything important to you.</p>

      <h2 style={h}>Changes to these terms</h2>
      <p style={s}>We may update these terms. If we make significant changes, we'll notify you by email. Continued use after changes means you accept the new terms.</p>

      <h2 style={h}>Contact</h2>
      <p style={s}>Questions? Email us at support@decisiongate.app.</p>

      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12, marginBottom: 32 }}>← Back</button>
    </div>
  );
}

// ============ SPLASH ============

function SplashScreen({ onContinue }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9" />
        </svg>
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: "#F1F5F9", textAlign: "center", marginBottom: 16 }}>Decision Gate</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0", textAlign: "center", maxWidth: 340, lineHeight: 1.6, marginBottom: 12 }}>
        Learn when you make your best and worst decisions — and protect yourself on the bad days.
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 40 }}>
        A 30-second daily check-in tracks your capacity, guards your spending, and builds a picture of your decision patterns over time.
      </p>
      <button onClick={onContinue} style={{ padding: "18px 48px", background: "#6366F1", border: "none", borderRadius: 16, color: "#fff", fontSize: 17, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", width: "100%", maxWidth: 320 }}>
        Start check-in →
      </button>
    </div>
  );
}

// ============ CHECK-IN ============

function CapacityCheckin({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const questions = [
    { id: "sleep", q: "How did you sleep last night?", options: [{ label: "Well", value: 3, icon: "😌" }, { label: "OK", value: 2, icon: "😐" }, { label: "Badly", value: 1, icon: "😩" }] },
    { id: "energy", q: "What's your energy level right now?", options: [{ label: "Good", value: 3, icon: "⚡" }, { label: "Medium", value: 2, icon: "🔋" }, { label: "Low", value: 1, icon: "🪫" }] },
    { id: "stress", q: "Any high-stress events today?", options: [{ label: "No", value: 3, icon: "😊" }, { label: "Maybe", value: 2, icon: "😬" }, { label: "Yes", value: 1, icon: "😰" }] },
    { id: "impulse", q: "How are you feeling emotionally?", options: [{ label: "Calm", value: 3, icon: "🧘" }, { label: "A bit off", value: 2, icon: "🌊" }, { label: "Reactive", value: 1, icon: "🔥" }] },
  ];

  const handleAnswer = (id, value) => {
    const na = { ...answers, [id]: value };
    setAnswers(na);
    if (step < questions.length - 1) setTimeout(() => setStep(step + 1), 300);
    else {
      const total = Object.values(na).reduce((a, b) => a + b, 0);
      let mode = "full";
      if (total <= 6) mode = "survival";
      else if (total <= 9) mode = "light";
      setTimeout(() => onComplete(mode, na, total), 500);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const p = questions[step - 1];
      const na = { ...answers };
      delete na[p.id];
      setAnswers(na);
      setStep(step - 1);
    }
  };

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 40 }}>
        <div style={{ height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: progress + "%", background: "#6366F1", borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          {step > 0 ? (
            <button onClick={handleBack} style={{ background: "none", border: "none", color: "#6366F1", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: "4px 0" }}>
              ← Back
            </button>
          ) : <span />}
          <p style={{ color: "#64748B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{step + 1} of {questions.length}</p>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 40, lineHeight: 1.3, maxWidth: 360 }}>
        {current.q}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
        {current.options.map(opt => (
          <button
            key={opt.label}
            onClick={() => handleAnswer(current.id, opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 24px",
              background: answers[current.id] === opt.value ? "#1E293B" : "#0F172A",
              border: answers[current.id] === opt.value ? "2px solid #6366F1" : "2px solid #1E293B",
              borderRadius: 16,
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
            }}
          >
            <span style={{ fontSize: 28 }}>{opt.icon}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0", fontWeight: 500 }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ TIMER ALERT ============

function TimerAlert({ item, onResolve, onSnooze }) {
  const [resolved, setResolved] = useState(null);

  if (resolved) {
    const skipped = resolved === "skip";
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {skipped && (
          <div style={confettiContainer}>
            {["🎉", "💰", "✨", "🛡️", "💪"].map((e, i) => (
              <span key={i} style={{ ...confettiPiece, left: (15 + i * 17) + "%", animationDelay: (i * 0.12) + "s" }}>{e}</span>
            ))}
          </div>
        )}
        <span style={{ fontSize: 64, marginBottom: 20 }}>{skipped ? "🛡️" : "👍"}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: skipped ? "#4ADE80" : "#FBBF24", textAlign: "center", marginBottom: 12 }}>
          {skipped ? "$" + item.amount.toLocaleString() + " saved!" : "Nice — that's a thoughtful purchase ✨"}
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>
          {skipped ? "You waited, the urge passed, and you kept your money." : "You waited, thought it through, and decided it's worth it. That's the whole point."}
        </p>
        <button onClick={() => onResolve(item.id, resolved)} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <span style={{ fontSize: 52, marginBottom: 16 }}>⏰</span>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 8, maxWidth: 340, lineHeight: 1.3 }}>
        Timer's up
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#94A3B8", textAlign: "center", marginBottom: 6 }}>{item.item}</p>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: "#F1F5F9", textAlign: "center", marginBottom: 8 }}>${item.amount.toLocaleString()}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 36 }}>You logged this {item.waitHours} hours ago. Still want it?</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        <button onClick={() => setResolved("skip")} style={gateBtn("#0A2E1A", "#4ADE80")}>Skip it — save ${item.amount.toLocaleString()}</button>
        <button onClick={() => setResolved("buy")} style={gateBtn("#1E293B", "#94A3B8")}>Buy it — I've thought it through</button>
        <button onClick={() => onSnooze(item.id)} style={{ padding: "16px 24px", background: "transparent", border: "1px solid #334155", borderRadius: 16, color: "#94A3B8", fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer", width: "100%", textAlign: "center" }}>
          Still not sure — add 24 more hours
        </button>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============

function Dashboard({ mode, setScreen, spendLog, pendingItems, readyItems, checkins, onLogout }) {
  const m = MODES[mode];
  const totalCheckins = (checkins || []).length;
  const spendEntries = spendLog.filter(e => e.type === "spend");
  const savedAmount = spendEntries.filter(e => e.decision === "skip").reduce((s, e) => s + (e.amount || 0), 0);
  const hasReady = readyItems.length > 0;
  const isSurvival = mode === "survival";
  const isLight = mode === "light";

  let streak = 0;
  if (totalCheckins > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = [...new Set(checkins.map(c => {
      const d = new Date(c.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    const diffFromToday = Math.floor((today.getTime() - uniqueDays[0]) / (1000 * 60 * 60 * 24));
    if (diffFromToday <= 1) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        if (Math.floor((uniqueDays[i - 1] - uniqueDays[i]) / (1000 * 60 * 60 * 24)) === 1) streak++;
        else break;
      }
    }
  }

  const modeCount = { full: 0, light: 0, survival: 0 };
  (checkins || []).forEach(c => {
    if (modeCount[c.mode] !== undefined) modeCount[c.mode]++;
  });

  const patternData = ["full", "light", "survival"].map(key => ({
    key,
    label: MODES[key].label.replace(" Day", ""),
    pct: totalCheckins > 0 ? Math.round((modeCount[key] / totalCheckins) * 100) : 0,
    color: MODES[key].color,
  })).filter(x => x.pct > 0);

  const survivalSpend = spendEntries.filter(e => e.modeAtTime === "survival");
  const fullSpend = spendEntries.filter(e => e.modeAtTime === "full");
  const survivalSkipRate = survivalSpend.length > 0 ? Math.round((survivalSpend.filter(e => e.decision === "skip").length / survivalSpend.length) * 100) : null;
  const fullSkipRate = fullSpend.length > 0 ? Math.round((fullSpend.filter(e => e.decision === "skip").length / fullSpend.length) * 100) : null;

  let learningInsight = null;
  if (survivalSkipRate !== null && fullSkipRate !== null && survivalSkipRate < fullSkipRate) {
    learningInsight = {
      tone: "warn",
      text: "Pattern: You’re more likely to spend quickly on low-capacity days.",
    };
  } else if (survivalSkipRate !== null && fullSkipRate !== null && survivalSkipRate >= fullSkipRate) {
    learningInsight = {
      tone: "good",
      text: "Pattern: Your guardrails are still holding up even on hard days.",
    };
  } else if (totalCheckins >= 3) {
    const mostCommon = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mostCommon === "survival") {
      learningInsight = {
        tone: "warn",
        text: "Pattern: You’ve had more low-capacity days lately. Keep decisions simple when you can.",
      };
    } else if (mostCommon === "light") {
      learningInsight = {
        tone: "mixed",
        text: "Pattern: Most days lately have been mixed. Use Decision Gate before emotional choices.",
      };
    } else {
      learningInsight = {
        tone: "good",
        text: "Pattern: You’ve mostly been in a strong decision state lately. Good time to tackle what matters.",
      };
    }
  }

  const primaryCardStyle = {
    width: "100%",
    background: "#0F172A",
    border: "1px solid #2A3655",
    borderRadius: 22,
    padding: "18px 18px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  };

  const iconWrap = {
    width: 56,
    height: 56,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "rgba(255,255,255,0.04)",
  };

  const sectionLabel = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "#64748B",
    margin: "0 0 8px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 4,
  };

  const secondaryCard = {
    width: "100%",
    background: "#0F172A",
    border: "1px solid #1E293B",
    borderRadius: 18,
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    textAlign: "left",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "30px 20px 24px", maxWidth: 480, margin: "0 auto" }}>
      {/* HERO */}
      <section
        style={{
          background: m.bg,
          border: "2px solid " + m.color + "30",
          borderRadius: 28,
          padding: "22px 20px",
          marginBottom: 18,
          boxShadow: "0 18px 36px rgba(0,0,0,0.16)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: m.color, boxShadow: `0 0 22px ${m.color}99` }} />
          <div>
            <p style={{ ...sectionLabel, margin: "0 0 4px", color: m.color + "AA" }}>Today</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 40, lineHeight: 1, fontWeight: 600, color: m.color, margin: 0 }}>
              {m.label}
            </h1>
          </div>
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#D5DFEC", margin: "16px 0 18px", lineHeight: 1.5 }}>
          {m.desc}
        </p>

        <div
          style={{
            background: "rgba(0,0,0,0.10)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 22,
            padding: "16px 16px",
          }}
        >
          <p style={{ ...sectionLabel, margin: "0 0 10px", color: "#A8C7B5" }}>Today’s focus</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#F1F5F9", margin: "0 0 16px", lineHeight: 1.55 }}>
            {m.focus}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#98D4B1", margin: 0, lineHeight: 1.45 }}>
            Best use today: decisions that matter, not decisions you’re avoiding.
          </p>
        </div>
      </section>

      {/* READY TIMER */}
      {hasReady && (
        <section
          style={{
            background: "#11133A",
            border: "1px solid #3B3FD9",
            borderRadius: 24,
            padding: "18px 18px",
            marginBottom: 16,
            boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
            <div>
              <p style={{ ...sectionLabel, margin: "0 0 10px", color: "#8F95F6" }}>Needs attention</p>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#F1F5F9", margin: "0 0 10px", fontWeight: 700 }}>
                {readyItems.length} timer{readyItems.length > 1 ? "s are" : " is"} ready
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#B6C0D2", margin: 0, lineHeight: 1.5 }}>
                Review what you paused earlier and decide with a clear head.
              </p>
            </div>

            <button
              onClick={() => setScreen("timer-alert")}
              style={{
                background: "#6366F1",
                border: "none",
                borderRadius: 16,
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 18px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Review
            </button>
          </div>
        </section>
      )}

      {/* PRIMARY ACTIONS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
        <button
          onClick={() => setScreen("decision")}
          style={{
            ...primaryCardStyle,
            border: isLight ? "1px solid #FBBF2450" : isSurvival ? "1px solid #F8717150" : "1px solid #2A3655",
          }}
        >
          <div style={{ ...iconWrap, background: "rgba(74,222,128,0.08)" }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
                Decision Gate
              </p>
              <span
                style={{
                  background: "rgba(74,222,128,0.10)",
                  color: "#6EE7B7",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Primary
              </span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#93A4BD", margin: 0, lineHeight: 1.45 }}>
              Check whether now is a good time to decide.
            </p>
          </div>
          <span style={{ color: "#51627D", fontSize: 22 }}>›</span>
        </button>

        <button
          onClick={() => setScreen("spend")}
          style={{
            ...primaryCardStyle,
            border: isSurvival ? "1px solid #F8717150" : "1px solid #2A3655",
          }}
        >
          <div style={{ ...iconWrap, background: "rgba(251,191,36,0.08)" }}>
            <span style={{ fontSize: 28 }}>💳</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
                Spend Check
              </p>
              <span
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#CBD5E1",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Fast
              </span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#93A4BD", margin: 0, lineHeight: 1.45 }}>
              Pause purchases before impulse takes over.
            </p>
          </div>
          <span style={{ color: "#51627D", fontSize: 22 }}>›</span>
        </button>
      </div>

      {/* LEARNING */}
      {totalCheckins > 0 && (
        <section
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 26,
            padding: "18px 18px",
            marginBottom: 18,
            boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p style={sectionLabel}>Learning</p>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#F8FAFC", margin: 0, fontWeight: 700 }}>
                What the app is learning about you
              </h2>
            </div>

            <button
              onClick={() => setScreen("patterns")}
              style={{
                background: "none",
                border: "none",
                color: "#818CF8",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 0",
                flexShrink: 0,
              }}
            >
              See all
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 18, padding: "14px 10px", textAlign: "center" }}>
              <p style={{ ...sectionLabel, fontSize: 10, letterSpacing: 3, margin: "0 0 10px" }}>Streak</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#F8FAFC", margin: "0 0 2px" }}>{streak}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8", margin: 0 }}>day{streak !== 1 ? "s" : ""}</p>
            </div>

            <div style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 18, padding: "14px 10px", textAlign: "center" }}>
              <p style={{ ...sectionLabel, fontSize: 10, letterSpacing: 3, margin: "0 0 10px" }}>Saved</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#5EEAD4", margin: "0 0 2px" }}>${savedAmount.toLocaleString()}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8", margin: 0 }}>so far</p>
            </div>

            <div style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 18, padding: "14px 10px", textAlign: "center" }}>
              <p style={{ ...sectionLabel, fontSize: 10, letterSpacing: 3, margin: "0 0 10px" }}>Check-ins</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#F8FAFC", margin: "0 0 2px" }}>{totalCheckins}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8", margin: 0 }}>total</p>
            </div>
          </div>

          {totalCheckins >= 3 && (
            <div style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 20, padding: "16px 14px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#F8FAFC", margin: 0, fontWeight: 600 }}>Mode snapshot</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", margin: 0 }}>last {totalCheckins} check-ins</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: learningInsight ? 16 : 0 }}>
                {patternData.map(row => (
                  <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 72, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#CBD5E1" }}>{row.label}</div>
                    <div style={{ flex: 1, height: 10, background: "#1E293B", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: row.pct + "%", height: "100%", background: row.color, borderRadius: 999 }} />
                    </div>
                    <div style={{ width: 42, textAlign: "right", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8" }}>{row.pct}%</div>
                  </div>
                ))}
              </div>

              {learningInsight && (
                <div
                  style={{
                    borderRadius: 16,
                    padding: "14px 14px",
                    background: learningInsight.tone === "warn"
                      ? "rgba(251,191,36,0.06)"
                      : learningInsight.tone === "mixed"
                      ? "rgba(99,102,241,0.08)"
                      : "rgba(74,222,128,0.08)",
                    border: learningInsight.tone === "warn"
                      ? "1px solid rgba(251,191,36,0.28)"
                      : learningInsight.tone === "mixed"
                      ? "1px solid rgba(99,102,241,0.24)"
                      : "1px solid rgba(74,222,128,0.24)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      lineHeight: 1.55,
                      margin: 0,
                      color: learningInsight.tone === "warn"
                        ? "#FDE68A"
                        : learningInsight.tone === "mixed"
                        ? "#C7D2FE"
                        : "#BBF7D0",
                    }}
                  >
                    {learningInsight.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* PENDING TIMERS */}
      {pendingItems.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <p style={sectionLabel}>Waiting on</p>
          <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 24, padding: "16px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#F8FAFC", margin: 0, fontWeight: 700 }}>Pending purchase timers</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", margin: 0 }}>{pendingItems.length} active</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingItems.map(item => {
                const remaining = timeRemaining(item.expiry);
                return (
                  <div key={item.id} style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 18, padding: "16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#F8FAFC", margin: 0, fontWeight: 600 }}>{item.item}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>${item.amount.toLocaleString()}</p>
                    </div>
                    <div style={{ background: "#171C4D", borderRadius: 14, padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#BFC8FF", fontWeight: 700, flexShrink: 0 }}>
                      {remaining || "Ready"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MORE TOOLS */}
      <section style={{ marginBottom: 16 }}>
        <p style={sectionLabel}>More tools</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => setScreen("history")} style={secondaryCard}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📊</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Decision Log</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>
                {spendLog.length} entries · {spendEntries.filter(e => e.decision === "skip").length} delayed · {spendEntries.filter(e => e.decision === "buy").length} decided
              </p>
            </div>
            <span style={{ color: "#51627D", fontSize: 20 }}>›</span>
          </button>

          <button onClick={() => setScreen("transition")} style={secondaryCard}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔄</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Change Gears</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>
                Use a short reset when you need to switch states
              </p>
            </div>
            <span style={{ color: "#51627D", fontSize: 20 }}>›</span>
          </button>

          <button
            onClick={() => setScreen("quicklog")}
            style={{
              width: "100%",
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 18,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 22 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Quick Log</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>
                Record a purchase or decision you already made
              </p>
            </div>
            <span style={{ color: "#51627D", fontSize: 20 }}>›</span>
          </button>
        </div>
      </section>

      {/* UTILITY */}
      <button
        onClick={() => setScreen("checkin")}
        style={{
          width: "100%",
          padding: "18px 18px",
          background: "transparent",
          border: "1px solid #334155",
          borderRadius: 20,
          color: "#CBD5E1",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        Redo check-in
      </button>

      <button
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "8px",
          background: "transparent",
          border: "none",
          color: "#475569",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Log out
      </button>
    </div>
  );
}

// ============ REBUILT DECISION GATE ============

function DecisionGate({ mode, onBack, onLog }) {
  const [phase, setPhase] = useState("select_type"); // select_type, custom_input, grounding, questions, result
  const [decisionLabel, setDecisionLabel] = useState("");
  const [step, setStep] = useState(0);
  const [flags, setFlags] = useState(0);
  const [answerHistory, setAnswerHistory] = useState([]);

  // PHASE 1: Categorize (Kill the Keyboard)
  if (phase === "select_type") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {mode === "survival" && (
          <div style={{ background: "#2E0A0A", border: "1px solid #F8717140", borderRadius: 12, padding: "10px 16px", marginBottom: 28 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F87171", margin: 0 }}>🔴 Survival mode — keep it simple today</p>
          </div>
        )}
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 24, maxWidth: 340, lineHeight: 1.4 }}>
          What kind of decision is this?
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
          {DECISION_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => {
                if (type.id === "custom") {
                  setPhase("custom_input");
                } else {
                  setDecisionLabel(type.label);
                  setPhase("grounding");
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 16, cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: 24 }}>{type.icon}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E2E8F0", fontWeight: 500 }}>{type.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 24 }}>← Cancel</button>
      </div>
    );
  }

  // PHASE 1.5: Optional Custom Input
  if (phase === "custom_input") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 16 }}>Write it out</h2>
        <textarea
          value={decisionLabel}
          onChange={e => setDecisionLabel(e.target.value)}
          placeholder="Briefly describe the decision..."
          style={{ width: "100%", maxWidth: 320, minHeight: 120, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 14, color: "#F1F5F9", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical" }}
          autoFocus
        />
        <button onClick={() => setPhase("grounding")} disabled={!decisionLabel.trim()} style={{ ...primaryBtn, marginTop: 20, opacity: decisionLabel.trim() ? 1 : 0.4 }}>
          Next →
        </button>
        <button onClick={() => setPhase("select_type")} style={{ ...backBtnStyle, marginTop: 16 }}>← Back</button>
      </div>
    );
  }

  // PHASE 2: The Physical Grounding (The Interrupt)
  if (phase === "grounding") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 32, maxWidth: 340, lineHeight: 1.4 }}>
          Okay. Before we look at this decision, do me a favor:
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 300, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24 }}>🧘</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0" }}>Drop your shoulders.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24 }}>😌</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0" }}>Unclench your jaw.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24 }}>😮‍💨</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0" }}>Take one slow breath.</span>
          </div>
        </div>

        <button onClick={() => setPhase("questions")} style={primaryBtn}>
          Done. Let's look at the decision →
        </button>
        <button onClick={() => setPhase("select_type")} style={{ ...backBtnStyle, marginTop: 16 }}>← Back</button>
      </div>
    );
  }

  // PHASE 3: Reality Checks
  if (phase === "questions") {
    const handleAnswer = (flagValue) => {
      const newFlags = flags + flagValue;
      setFlags(newFlags);
      setAnswerHistory([...answerHistory, flagValue]);
      
      if (step < GROUNDING_QUESTIONS.length - 1) {
        setTimeout(() => setStep(step + 1), 250);
      } else {
        setTimeout(() => setPhase("result"), 250);
      }
    };

    const handleGateBack = () => {
      if (step > 0) {
        const prevValue = answerHistory[answerHistory.length - 1] || 0;
        setFlags(flags - prevValue);
        setAnswerHistory(answerHistory.slice(0, -1));
        setStep(step - 1);
      } else {
        setPhase("grounding");
      }
    };

    const current = GROUNDING_QUESTIONS[step];
    
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 10, padding: "8px 14px", marginBottom: 28, maxWidth: 320 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", margin: 0 }}>
            Deciding: <span style={{ color: "#94A3B8" }}>{decisionLabel.length > 35 ? decisionLabel.substring(0, 35) + "..." : decisionLabel}</span>
          </p>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 36, maxWidth: 340, lineHeight: 1.4 }}>
          {current.q}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
          {current.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(opt.flags)} 
              style={gateBtn(opt.bg, opt.color)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button onClick={handleGateBack} style={{ ...backBtnStyle, marginTop: 40 }}>← Back</button>
      </div>
    );
  }

  // PHASE 4: Permission Output
  if (phase === "result") {
    // Determine risk based on answers + today's mode
    const modeFlag = mode === "survival" ? 1 : mode === "light" ? 0.5 : 0;
    const totalRisk = flags + modeFlag;
    
    // If risk is high, it's a stop. If risk is low, they are clear.
    const safe = totalRisk <= 1;

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>{safe ? "✅" : "🛑"}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: safe ? "#4ADE80" : "#FBBF24", textAlign: "center", marginBottom: 12 }}>
          {safe ? "Clear to proceed" : "Give yourself 24 hours"}
        </h2>
        
        <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12, padding: "12px 16px", marginBottom: 16, maxWidth: 320 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", margin: 0, fontStyle: "italic" }}>"{decisionLabel}"</p>
        </div>
        
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>
          {safe 
            ? "You're in a solid headspace. You can trust your judgment on this right now. Take your time, and make the call." 
            : "Your brain is spinning or your tank is empty. The smartest choice you can make right now is to put this in a box until tomorrow. You are officially off the hook for making this call today."}
        </p>

        <button 
          onClick={() => { 
            onLog({ type: "decision", item: decisionLabel, decision: safe ? "go" : "stop", flags: flags }); 
            onBack(); 
          }} 
          style={primaryBtn}
        >
          {safe ? "Got it →" : "Save this for tomorrow →"}
        </button>
      </div>
    );
  }

  return null;
}

// ============ SPEND CHECK ============

function ATMKeypad({ value, onChange }) {
  const handleKey = (key) => {
    if (key === "del") {
      onChange(value.slice(0, -1));
    } else if (key === ".") {
      if (!value.includes(".")) onChange(value + ".");
    } else {
      if (value.includes(".") && value.split(".")[1].length >= 2) return;
      onChange(value + key);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", maxWidth: 320 }}>
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => handleKey(k)}
          style={{
            padding: "20px 0",
            background: k === "del" ? "#1E293B" : "#0F172A",
            border: "2px solid #1E293B",
            borderRadius: 14,
            color: k === "del" ? "#F87171" : "#F1F5F9",
            fontSize: 24,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "center",
            minHeight: 64,
            transition: "all 0.15s ease",
          }}
        >
          {k === "del" ? "⌫" : k}
        </button>
      ))}
    </div>
  );
}

const SPEND_CATEGORIES = [
  { emoji: "🎮", label: "Tech" },
  { emoji: "👕", label: "Clothes" },
  { emoji: "🍔", label: "Food/Drink" },
  { emoji: "🧶", label: "Hobby" },
  { emoji: "🧴", label: "Care" },
  { emoji: "✨", label: "Random" },
];

function CategoryGrid({ onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, width: "100%", maxWidth: 320 }}>
      {SPEND_CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onSelect(cat.emoji + " " + cat.label)}
          style={{
            padding: "22px 12px",
            background: "#0F172A",
            border: "2px solid #1E293B",
            borderRadius: 16,
            color: "#F1F5F9",
            fontSize: 16,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            cursor: "pointer",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            minHeight: 80,
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: 32 }}>{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

function SpendCheck({ mode, onBack, onWait, onBuyNow }) {
  const [step, setStep] = useState(0);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [waitHours, setWaitHours] = useState(null);
  const [result, setResult] = useState(null);

  if (result === "waiting") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>⏳</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#6366F1", textAlign: "center", marginBottom: 12 }}>Timer set — {waitHours} hours</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 8 }}>
          We'll check back on <strong style={{ color: "#E2E8F0" }}>{item}</strong> (${parseFloat(amount).toLocaleString()}) when your timer is up.
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 300, lineHeight: 1.5, marginBottom: 32 }}>
          If you still want it then, buy it with confidence. If not, you just saved ${parseFloat(amount).toLocaleString()}.
        </p>
        <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }

  if (result === "bought") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>👍</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#FBBF24", textAlign: "center", marginBottom: 12 }}>Logged — you decided to buy now</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#94A3B8", textAlign: "center", maxWidth: 300, lineHeight: 1.5, marginBottom: 32 }}>
          It's logged so you can see patterns over time.
        </p>
        <button onClick={onBack} style={backBtnStyle}>← Back to dashboard</button>
      </div>
    );
  }

  if (result === "nevermind") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={confettiContainer}>
          {["🎉", "💰", "✨", "🛡️", "💪"].map((e, i) => (
            <span key={i} style={{ ...confettiPiece, left: (15 + i * 17) + "%", animationDelay: (i * 0.12) + "s" }}>{e}</span>
          ))}
        </div>
        <span style={{ fontSize: 64, marginBottom: 20 }}>🛡️</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#4ADE80", textAlign: "center", marginBottom: 12 }}>${parseFloat(amount).toLocaleString()} saved!</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>
          You thought it through and realized you don't need it. That's a win.
        </p>
        <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }

  // Step 0: ATM Keypad for price
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {mode === "survival" && (
          <div style={{ background: "#2E0A0A", border: "1px solid #F8717140", borderRadius: 12, padding: "12px 16px", marginBottom: 28, maxWidth: 340 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#F87171", margin: 0, textAlign: "center" }}>🔴 Survival mode — impulse spending is more likely right now. Take it slow.</p>
          </div>
        )}
        <h2 style={screenTitle}>How much is it?</h2>
        <div style={{
          width: "100%", maxWidth: 320, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B",
          borderRadius: 14, textAlign: "center", marginBottom: 20, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, fontWeight: 700, color: amount ? "#F1F5F9" : "#334155" }}>
            ${amount || "0"}
          </span>
        </div>
        <ATMKeypad value={amount} onChange={setAmount} />
        <button
          onClick={() => { if (amount && parseFloat(amount) > 0) setStep(1); }}
          disabled={!amount || parseFloat(amount) <= 0}
          style={{ ...primaryBtn, marginTop: 20, opacity: amount && parseFloat(amount) > 0 ? 1 : 0.4 }}
        >
          Next →
        </button>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 16 }}>← Cancel</button>
      </div>
    );
  }

  // Step 1: Category grid
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={screenTitle}>What's it for?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", marginBottom: 24, textAlign: "center" }}>${parseFloat(amount).toLocaleString()}</p>
        <CategoryGrid onSelect={(category) => { setItem(category); setStep(2); }} />
        <button onClick={() => setStep(0)} style={{ ...backBtnStyle, marginTop: 24 }}>← Back</button>
      </div>
    );
  }

  // Step 2: Decision with auto-calculated wait time
  if (step === 2) {
    const amt = parseFloat(amount);
    const suggestedWait = amt >= 200 ? 48 : amt >= 50 ? 24 : 12;
    const shouldWarn = mode === "survival" || amt >= 200;

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={screenTitle}>Set a wait timer?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", textAlign: "center", maxWidth: 300, lineHeight: 1.5, marginBottom: 8 }}>
          {item} — ${amt.toLocaleString()}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 300, lineHeight: 1.5, marginBottom: 8 }}>
          We'll check back and ask if you still want it.
        </p>
        {shouldWarn && (
          <div style={{ background: "#2E2A0A", border: "1px solid #FBBF2440", borderRadius: 12, padding: "12px 16px", marginBottom: 24, maxWidth: 340 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FBBF24", margin: 0, textAlign: "center" }}>
              {mode === "survival" ? "⚠️ Survival mode — strongly recommend waiting." : "⚠️ $" + amt.toLocaleString() + " is a big purchase. Give yourself time."}
            </p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300, marginBottom: 20 }}>
          <button
            onClick={() => { setWaitHours(suggestedWait); onWait({ item, amount: amt, needWant: "N/A", waitHours: suggestedWait }); setResult("waiting"); }}
            style={{ padding: "18px 20px", background: "#1A1A2E", border: "2px solid #6366F1", borderRadius: 14, cursor: "pointer", width: "100%", textAlign: "center" }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: "#6366F1" }}>⏳ Wait {suggestedWait} hours</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6366F1", display: "block", marginTop: 4 }}>recommended</span>
          </button>
        </div>
        <div style={{ width: "100%", maxWidth: 300, borderTop: "1px solid #1E293B", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => { onBuyNow({ item, amount: amt, needWant: "N/A", decision: "skip" }); setResult("nevermind"); }} style={{ width: "100%", padding: "14px", background: "#0A2E1A", border: "1px solid #4ADE8030", borderRadius: 12, color: "#4ADE80", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Actually, I don't need it — save ${amt.toLocaleString()}
          </button>
          <button onClick={() => { onBuyNow({ item, amount: amt, needWant: "N/A", decision: "buy" }); setResult("bought"); }} style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid #334155", borderRadius: 12, color: "#94A3B8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer" }}>
            Skip timer — buy it now
          </button>
        </div>
        <button onClick={() => { setStep(1); setItem(""); }} style={{ ...backBtnStyle, marginTop: 16 }}>← Back</button>
      </div>
    );
  }
}

// ============ QUICK LOG ============

function QuickLog({ onBack, onLog }) {
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(null);

  if (done) {
    const skipped = done === "skip";
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>{skipped ? "🛡️" : "👍"}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: skipped ? "#4ADE80" : "#FBBF24", textAlign: "center", marginBottom: 12 }}>
          {skipped ? "Logged — $" + parseFloat(amount).toLocaleString() + " saved" : "Logged — purchased"}
        </h2>
        <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }

  // Step 2: Skip or Buy decision
  if (step === 2) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={screenTitle}>What did you do?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", marginBottom: 28, textAlign: "center" }}>{item} — ${parseFloat(amount).toLocaleString()}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
          <button onClick={() => { onLog({ type: "spend", item, amount: parseFloat(amount), needWant: "N/A", decision: "skip" }); setDone("skip"); }} style={gateBtn("#0A2E1A", "#4ADE80")}>I skipped it</button>
          <button onClick={() => { onLog({ type: "spend", item, amount: parseFloat(amount), needWant: "N/A", decision: "buy" }); setDone("buy"); }} style={gateBtn("#1E293B", "#94A3B8")}>I bought it</button>
        </div>
        <button onClick={() => { setStep(1); setItem(""); }} style={{ ...backBtnStyle, marginTop: 32 }}>← Back</button>
      </div>
    );
  }

  // Step 1: Category grid
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={screenTitle}>What was it for?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", marginBottom: 24, textAlign: "center" }}>${parseFloat(amount).toLocaleString()}</p>
        <CategoryGrid onSelect={(category) => { setItem(category); setStep(2); }} />
        <button onClick={() => setStep(0)} style={{ ...backBtnStyle, marginTop: 24 }}>← Back</button>
      </div>
    );
  }

  // Step 0: ATM Keypad for amount
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <span style={{ fontSize: 36, marginBottom: 16 }}>⚡</span>
      <h2 style={screenTitle}>Quick log</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 300, marginBottom: 24 }}>
        Log something you already decided on. No timer, no steps — just record it.
      </p>
      <div style={{
        width: "100%", maxWidth: 320, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B",
        borderRadius: 14, textAlign: "center", marginBottom: 20, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, fontWeight: 700, color: amount ? "#F1F5F9" : "#334155" }}>
          ${amount || "0"}
        </span>
      </div>
      <ATMKeypad value={amount} onChange={setAmount} />
      <button
        onClick={() => { if (amount && parseFloat(amount) > 0) setStep(1); }}
        disabled={!amount || parseFloat(amount) <= 0}
        style={{ ...primaryBtn, marginTop: 20, opacity: amount && parseFloat(amount) > 0 ? 1 : 0.4 }}
      >
        Next →
      </button>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 16 }}>← Cancel</button>
    </div>
  );
}

// ============ PATTERNS ============

function Patterns({ checkins, spendLog, onBack }) {
  const totalCheckins = checkins.length;
  const spendEntries = spendLog.filter(e => e.type === "spend");

  let streak = 0;
  if (totalCheckins > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = [...new Set(checkins.map(c => {
      const d = new Date(c.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    const mostRecent = uniqueDays[0];
    const diffFromToday = Math.floor((today.getTime() - mostRecent) / (1000 * 60 * 60 * 24));
    if (diffFromToday <= 1) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const gap = Math.floor((uniqueDays[i - 1] - uniqueDays[i]) / (1000 * 60 * 60 * 24));
        if (gap === 1) streak++;
        else break;
      }
    }
  }

  const modeCount = { full: 0, light: 0, survival: 0 };
  checkins.forEach(c => { if (modeCount[c.mode] !== undefined) modeCount[c.mode]++; });
  const mostCommonMode = totalCheckins > 0 ? Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0][0] : null;

  const avgSleep = totalCheckins > 0 ? (checkins.reduce((s, c) => s + c.sleep, 0) / totalCheckins).toFixed(1) : null;
  const avgEnergy = totalCheckins > 0 ? (checkins.reduce((s, c) => s + c.energy, 0) / totalCheckins).toFixed(1) : null;
  const avgStress = totalCheckins > 0 ? (checkins.reduce((s, c) => s + c.stress, 0) / totalCheckins).toFixed(1) : null;
  const avgEmotion = totalCheckins > 0 ? (checkins.reduce((s, c) => s + c.emotion, 0) / totalCheckins).toFixed(1) : null;

  const spendByMode = {
    full: { skip: 0, buy: 0, savedAmt: 0, spentAmt: 0 },
    light: { skip: 0, buy: 0, savedAmt: 0, spentAmt: 0 },
    survival: { skip: 0, buy: 0, savedAmt: 0, spentAmt: 0 },
  };

  spendEntries.forEach(e => {
    const m = e.modeAtTime;
    if (m && spendByMode[m]) {
      if (e.decision === "skip") {
        spendByMode[m].skip++;
        spendByMode[m].savedAmt += (e.amount || 0);
      } else {
        spendByMode[m].buy++;
        spendByMode[m].spentAmt += (e.amount || 0);
      }
    }
  });

  const totalSaved = spendEntries.filter(e => e.decision === "skip").reduce((s, e) => s + (e.amount || 0), 0);
  const totalSpent = spendEntries.filter(e => e.decision === "buy").reduce((s, e) => s + (e.amount || 0), 0);

  const modeBar = (mode, count) => {
    const pct = totalCheckins > 0 ? Math.round((count / totalCheckins) * 100) : 0;
    const colors = { full: "#4ADE80", light: "#FBBF24", survival: "#F87171" };
    return (
      <div key={mode} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E2E8F0", textTransform: "capitalize" }}>{MODES[mode].emoji} {MODES[mode].label}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B" }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: colors[mode], borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>
      </div>
    );
  };

  const skipRateByMode = (mode) => {
    const data = spendByMode[mode];
    const total = data.skip + data.buy;
    if (total === 0) return null;
    return Math.round((data.skip / total) * 100);
  };

  const scoreLabel = (val) => {
    const n = parseFloat(val);
    if (n >= 2.5) return { text: "Good", color: "#4ADE80" };
    if (n >= 1.8) return { text: "Mixed", color: "#FBBF24" };
    return { text: "Low", color: "#F87171" };
  };

  const sectionStyle = { background: "#0F172A", border: "1px solid #1E293B", borderRadius: 14, padding: "18px 20px", marginBottom: 16 };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 };

  if (totalCheckins < 2) {
    return (
      <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>My Patterns</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 32 }}>Your personal insights based on how you check in and what you decide.</p>
        <div style={{ ...sectionStyle, textAlign: "center", padding: "40px 20px" }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🌱</span>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#E2E8F0", margin: "0 0 8px" }}>Patterns need data</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", margin: 0, lineHeight: 1.6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            Keep checking in daily and using the tools. Your patterns will start appearing after a few days.
          </p>
        </div>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12 }}>← Back to dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>My Patterns</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 24 }}>Your personal insights based on how you check in and what you decide.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, ...sectionStyle, textAlign: "center", marginBottom: 0 }}>
          <p style={labelStyle}>Streak</p>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: streak >= 3 ? "#4ADE80" : "#6366F1", margin: "4px 0 0" }}>{streak}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>{streak === 1 ? "day" : "days"}</p>
        </div>
        <div style={{ flex: 1, ...sectionStyle, textAlign: "center", marginBottom: 0 }}>
          <p style={labelStyle}>Check-ins</p>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: "#6366F1", margin: "4px 0 0" }}>{totalCheckins}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>total</p>
        </div>
        <div style={{ flex: 1, ...sectionStyle, textAlign: "center", marginBottom: 0 }}>
          <p style={labelStyle}>Typical</p>
          <p style={{ fontSize: 28, margin: "4px 0 0" }}>{mostCommonMode ? MODES[mostCommonMode].emoji : "—"}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>{mostCommonMode ? MODES[mostCommonMode].label : ""}</p>
        </div>
      </div>

      <div style={sectionStyle}>
        <p style={{ ...labelStyle, marginBottom: 14 }}>Mode breakdown</p>
        {["full", "light", "survival"].map(m => modeBar(m, modeCount[m]))}
      </div>

      <div style={sectionStyle}>
        <p style={{ ...labelStyle, marginBottom: 14 }}>Your averages</p>
        {[
          { label: "Sleep", val: avgSleep, icon: "😴" },
          { label: "Energy", val: avgEnergy, icon: "⚡" },
          { label: "Stress", val: avgStress, icon: "😬" },
          { label: "Emotion", val: avgEmotion, icon: "🧘" },
        ].map(({ label, val, icon }) => {
          const sc = scoreLabel(val);
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1E293B" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E2E8F0" }}>{icon} {label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: sc.color, fontWeight: 600 }}>{val}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: sc.color }}>{sc.text}</span>
              </div>
            </div>
          );
        })}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569", margin: "10px 0 0" }}>Scale: 1 (worst) to 3 (best). Higher is better for all.</p>
      </div>

      {spendEntries.length > 0 && (
        <div style={sectionStyle}>
          <p style={{ ...labelStyle, marginBottom: 14 }}>Spending by mode</p>
          {["full", "light", "survival"].map(m => {
            const rate = skipRateByMode(m);
            const data = spendByMode[m];
            const total = data.skip + data.buy;
            if (total === 0) return null;
            return (
              <div key={m} style={{ padding: "10px 0", borderBottom: "1px solid #1E293B" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E2E8F0" }}>{MODES[m].emoji} {MODES[m].label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: rate >= 50 ? "#4ADE80" : "#F87171", fontWeight: 600 }}>{rate}% skipped</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4ADE80" }}>${data.savedAmt.toLocaleString()} saved</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#F87171" }}>${data.spentAmt.toLocaleString()} spent</span>
                </div>
              </div>
            );
          })}

          {(() => {
            const survRate = skipRateByMode("survival");
            const fullRate = skipRateByMode("full");
            if (survRate !== null && fullRate !== null && survRate < fullRate) {
              return (
                <div style={{ background: "#2E0A0A", border: "1px solid #F8717130", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F87171", margin: 0 }}>⚠️ You skip less on Survival days — you're more likely to impulse-buy when your capacity is low.</p>
                </div>
              );
            }
            if (survRate !== null && fullRate !== null && survRate >= fullRate) {
              return (
                <div style={{ background: "#0A2E1A", border: "1px solid #4ADE8030", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#4ADE80", margin: 0 }}>💪 Your skip rate holds up even on hard days. The guardrails are working.</p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {(totalSaved > 0 || totalSpent > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, ...sectionStyle, textAlign: "center", marginBottom: 0 }}>
            <p style={labelStyle}>Total saved</p>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#4ADE80", margin: "4px 0 0" }}>${totalSaved.toLocaleString()}</p>
          </div>
          <div style={{ flex: 1, ...sectionStyle, textAlign: "center", marginBottom: 0 }}>
            <p style={labelStyle}>Total spent</p>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#F87171", margin: "4px 0 0" }}>${totalSpent.toLocaleString()}</p>
          </div>
        </div>
      )}

      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12, marginBottom: 32 }}>← Back to dashboard</button>
    </div>
  );
}

// ============ TRANSITIONS ============

function TransitionPicker({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState({});

  if (selected) {
    const steps = TRANSITIONS[selected];
    const allDone = steps.every((_, i) => checked[i]);
    return (
      <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>{selected}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 28 }}>Take 2 minutes. Go through each step.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setChecked({ ...checked, [i]: !checked[i] })} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: checked[i] ? "#0A2E1A" : "#0F172A", border: checked[i] ? "2px solid #4ADE8040" : "2px solid #1E293B", borderRadius: 14, cursor: "pointer", transition: "all 0.2s ease", width: "100%", textAlign: "left" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, border: checked[i] ? "2px solid #4ADE80" : "2px solid #334155", background: checked[i] ? "#4ADE8020" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {checked[i] && <span style={{ color: "#4ADE80", fontSize: 14 }}>✓</span>}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: checked[i] ? "#4ADE80" : "#E2E8F0", textDecoration: checked[i] ? "line-through" : "none", opacity: checked[i] ? 0.7 : 1 }}>{s}</span>
            </button>
          ))}
        </div>
        {allDone && (
          <div style={{ background: "#0A2E1A", border: "2px solid #4ADE8030", borderRadius: 16, padding: "20px", marginTop: 24, textAlign: "center" }}>
            <span style={{ fontSize: 32 }}>🎯</span>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#4ADE80", margin: "8px 0 0" }}>Transition complete</p>
          </div>
        )}
        {allDone ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            <button onClick={onBack} style={primaryBtn}>Done — back to dashboard →</button>
            <button onClick={() => { setSelected(null); setChecked({}); }} style={backBtnStyle}>← Pick a different transition</button>
          </div>
        ) : (
          <button onClick={() => { setSelected(null); setChecked({}); }} style={{ ...backBtnStyle, marginTop: 24 }}>← Back to transitions</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>Change Gears</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 28 }}>Pick the shift you're making right now.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.keys(TRANSITIONS).map(key => (
          <button key={key} onClick={() => setSelected(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 16, cursor: "pointer", width: "100%", textAlign: "left" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E2E8F0", fontWeight: 500 }}>{key}</span>
            <span style={{ color: "#334155", fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 28 }}>← Back to dashboard</button>
    </div>
  );
}

// ============ DECISION LOG ============

function DecisionLog({ spendLog, onBack }) {
  const spendEntries = spendLog.filter(e => e.type !== "decision");
  const saved = spendEntries.filter(e => e.decision === "skip");
  const bought = spendEntries.filter(e => e.decision === "buy");
  const totalSaved = saved.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSpent = bought.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>Decision Log</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 24 }}>Your decisions over time. The more you log, the clearer your patterns become.</p>

      {spendEntries.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, background: "#0A2E1A", border: "1px solid #4ADE8030", borderRadius: 14, padding: "16px", textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4ADE80", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Saved</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#4ADE80", margin: 0 }}>${totalSaved.toLocaleString()}</p>
            </div>
            <div style={{ flex: 1, background: "#2E0A0A", border: "1px solid #F8717130", borderRadius: 14, padding: "16px", textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#F87171", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Spent</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#F87171", margin: 0 }}>${totalSpent.toLocaleString()}</p>
            </div>
          </div>

          <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", margin: "0 0 4px" }}>Wait rate</p>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#6366F1", margin: 0 }}>{spendEntries.length > 0 ? Math.round((saved.length / spendEntries.length) * 100) : 0}%</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>{saved.length} of {spendEntries.length} purchases paused</p>
          </div>
        </>
      )}

      {spendLog.length === 0 ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#475569", textAlign: "center", marginTop: 40 }}>No entries yet. Use the tools and your decisions will show up here.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...spendLog].reverse().map((entry, i) => {
            if (entry.type === "decision") {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{entry.item.length > 50 ? entry.item.substring(0, 50) + "..." : entry.item}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>decision · {entry.date}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: entry.decision === "go" ? "#4ADE80" : "#6366F1", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>
                      {entry.decision === "go" ? "decided" : "delayed"}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12 }}>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{entry.item}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>{entry.needWant} · {entry.date}{entry.waitHours ? " · waited " + entry.waitHours + "h" : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: entry.decision === "skip" ? "#4ADE80" : "#F87171", margin: 0, fontWeight: 600 }}>${(entry.amount || 0).toLocaleString()}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: entry.decision === "skip" ? "#4ADE80" : "#F87171", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{entry.decision === "skip" ? "saved" : "bought"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 28 }}>← Back to dashboard</button>
    </div>
  );
}

// ============ STYLES ============

const screenTitle = {
  fontFamily: "'Fraunces', serif",
  fontSize: 26,
  fontWeight: 500,
  color: "#F1F5F9",
  textAlign: "center",
  marginBottom: 28,
  lineHeight: 1.3,
  maxWidth: 360,
};

const inputStyle = {
  width: "100%",
  maxWidth: 320,
  padding: "16px 20px",
  background: "#0F172A",
  border: "2px solid #1E293B",
  borderRadius: 14,
  color: "#F1F5F9",
  fontSize: 16,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
};

const primaryBtn = {
  padding: "16px 32px",
  background: "#6366F1",
  border: "none",
  borderRadius: 14,
  color: "#fff",
  fontSize: 16,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
  maxWidth: 320,
};

const backBtnStyle = {
  padding: "12px 20px",
  background: "transparent",
  border: "1px solid #1E293B",
  borderRadius: 12,
  color: "#64748B",
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer",
};

const gateBtn = (bg, color) => ({
  padding: "18px 24px",
  background: bg,
  border: "2px solid " + color + "30",
  borderRadius: 16,
  color: color,
  fontSize: 16,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  cursor: "pointer",
  width: "100%",
  textAlign: "center",
  transition: "all 0.2s ease",
});

const confettiContainer = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "100vh",
  pointerEvents: "none",
  zIndex: 100,
};

const confettiPiece = {
  position: "absolute",
  top: "-20px",
  fontSize: 32,
  animation: "confettiFall 1.5s ease-out forwards",
};

// ============ MAIN APP ============

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [screen, setScreen] = useState(null);
  const [mode, setMode] = useState(null);
  const [spendLog, setSpendLog] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [currentTimerAlert, setCurrentTimerAlert] = useState(null);
  const [legalScreen, setLegalScreen] = useState(null);
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setDataLoaded(false);
      return;
    }
    loadUserData(session.user.id);
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => { setPendingItems(prev => [...prev]); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const readyItems = pendingItems.filter(item => Date.now() >= item.expiry);
  const waitingItems = pendingItems.filter(item => Date.now() < item.expiry);

  useEffect(() => {
    if (screen === "timer-alert" && readyItems.length > 0 && !currentTimerAlert) {
      setCurrentTimerAlert(readyItems[0]);
    }
  }, [screen, readyItems, currentTimerAlert]);

  const loadUserData = async (userId) => {
    try {
      const { data: checkins } = await supabase.from("checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(90);
      const { data: spendRows } = await supabase.from("spend_entries").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      const { data: decisionRows } = await supabase.from("decision_entries").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      const { data: timerRows } = await supabase.from("pending_timers").select("*").eq("user_id", userId);

      const spendMapped = (spendRows || []).map(r => ({
        type: "spend",
        item: r.item,
        amount: Number(r.amount),
        needWant: r.need_want,
        decision: r.decision,
        waitHours: r.wait_hours,
        date: new Date(r.created_at).toLocaleDateString(),
        modeAtTime: r.mode_at_time,
      }));

      const decisionMapped = (decisionRows || []).map(r => ({
        type: "decision",
        item: r.decision_text,
        decision: r.result,
        date: new Date(r.created_at).toLocaleDateString(),
        modeAtTime: r.mode_at_time,
      }));

      setSpendLog([...spendMapped, ...decisionMapped].sort((a, b) => new Date(a.date) - new Date(b.date)));

      setPendingItems((timerRows || []).map(r => ({
        id: r.id,
        item: r.item,
        amount: Number(r.amount),
        needWant: r.need_want,
        waitHours: r.wait_hours,
        expiry: new Date(r.expires_at).getTime(),
        date: new Date(r.created_at).toLocaleDateString(),
      })));

      const allCheckins = checkins || [];
      setCheckins(allCheckins);

      if (allCheckins.length > 0 && isToday(allCheckins[0].created_at)) {
        setMode(allCheckins[0].mode);
        setScreen("dashboard");
      } else if (allCheckins.length > 0) {
        setScreen("checkin");
      } else {
        setScreen("splash");
      }
      setDataLoaded(true);
    } catch (err) {
      console.error("Failed to load data:", err);
      setScreen("splash");
      setDataLoaded(true);
    }
  };

  const handleAuth = (s) => setSession(s);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setScreen(null);
    setMode(null);
    setSpendLog([]);
    setPendingItems([]);
    setCheckins([]);
    setDataLoaded(false);
  };

  const handleCheckinComplete = async (m, answers, total) => {
    setMode(m);
    setScreen("dashboard");
    const newCheckin = {
      sleep: answers.sleep,
      energy: answers.energy,
      stress: answers.stress,
      emotion: answers.impulse,
      total_score: total,
      mode: m,
      created_at: new Date().toISOString(),
    };
    setCheckins(prev => [newCheckin, ...prev]);

    if (session) {
      try {
        await supabase.from("checkins").insert({
          user_id: session.user.id,
          sleep: answers.sleep,
          energy: answers.energy,
          stress: answers.stress,
          emotion: answers.impulse,
          total_score: total,
          mode: m,
        });
      } catch (err) {
        console.error("Failed to save check-in:", err);
      }
    }
  };

  const handleWait = async (entry) => {
    const expiresAt = new Date(Date.now() + entry.waitHours * 60 * 60 * 1000).toISOString();
    const tempId = Date.now().toString();

    setPendingItems(prev => [...prev, {
      id: tempId,
      item: entry.item,
      amount: entry.amount,
      needWant: entry.needWant,
      waitHours: entry.waitHours,
      expiry: Date.now() + entry.waitHours * 60 * 60 * 1000,
      date: new Date().toLocaleDateString(),
    }]);

    if (session) {
      try {
        const { data } = await supabase.from("pending_timers").insert({
          user_id: session.user.id,
          item: entry.item,
          amount: entry.amount,
          need_want: entry.needWant,
          wait_hours: entry.waitHours,
          expires_at: expiresAt,
          mode_at_time: mode,
        }).select().single();

        if (data) {
          setPendingItems(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
        }
      } catch (err) {
        console.error("Failed to save timer:", err);
      }
    }
  };

  const handleBuyNow = async (entry) => {
    setSpendLog(prev => [...prev, {
      type: "spend",
      item: entry.item,
      amount: entry.amount,
      needWant: entry.needWant,
      decision: entry.decision,
      date: new Date().toLocaleDateString(),
      modeAtTime: mode,
    }]);

    if (session) {
      try {
        await supabase.from("spend_entries").insert({
          user_id: session.user.id,
          item: entry.item,
          amount: entry.amount,
          need_want: entry.needWant,
          decision: entry.decision,
          source: "spend_check",
          mode_at_time: mode,
        });
      } catch (err) {
        console.error("Failed to save spend entry:", err);
      }
    }
  };

  const handleLogEntry = async (entry) => {
    if (entry.type === "decision") {
      setSpendLog(prev => [...prev, {
        type: "decision",
        item: entry.item,
        decision: entry.decision,
        date: new Date().toLocaleDateString(),
        modeAtTime: mode,
      }]);

      if (session) {
        try {
          await supabase.from("decision_entries").insert({
            user_id: session.user.id,
            decision_text: entry.item,
            result: entry.decision,
            flags: entry.flags || 0,
            mode_at_time: mode,
          });
        } catch (err) {
          console.error("Failed to save decision:", err);
        }
      }
    } else {
      setSpendLog(prev => [...prev, {
        type: "spend",
        item: entry.item,
        amount: entry.amount,
        needWant: entry.needWant,
        decision: entry.decision,
        date: new Date().toLocaleDateString(),
        modeAtTime: mode,
      }]);

      if (session) {
        try {
          await supabase.from("spend_entries").insert({
            user_id: session.user.id,
            item: entry.item,
            amount: entry.amount,
            need_want: entry.needWant,
            decision: entry.decision,
            source: "quick_log",
            mode_at_time: mode,
          });
        } catch (err) {
          console.error("Failed to save quick log:", err);
        }
      }
    }
  };

  const handleTimerResolve = async (id, decision) => {
    const item = pendingItems.find(i => i.id === id);
    if (item) {
      setSpendLog(prev => [...prev, {
        type: "spend",
        item: item.item,
        amount: item.amount,
        needWant: item.needWant,
        decision,
        date: new Date().toLocaleDateString(),
        waitHours: item.waitHours,
        modeAtTime: mode,
      }]);
      setPendingItems(prev => prev.filter(i => i.id !== id));

      if (session) {
        try {
          await supabase.from("spend_entries").insert({
            user_id: session.user.id,
            item: item.item,
            amount: item.amount,
            need_want: item.needWant,
            decision,
            wait_hours: item.waitHours,
            source: "timer",
            mode_at_time: mode,
          });
          await supabase.from("pending_timers").delete().eq("id", id);
        } catch (err) {
          console.error("Failed to resolve timer:", err);
        }
      }
    }
    setCurrentTimerAlert(null);
    setScreen("dashboard");
  };

  const handleSnooze = async (id) => {
    const newExpiry = Date.now() + 24 * 60 * 60 * 1000;
    const currentItem = pendingItems.find(i => i.id === id);
    const newWaitHours = (currentItem?.waitHours || 0) + 24;

    setPendingItems(prev => prev.map(i => i.id === id ? { ...i, expiry: newExpiry, waitHours: newWaitHours } : i));

    if (session) {
      try {
        await supabase.from("pending_timers").update({
          expires_at: new Date(newExpiry).toISOString(),
          wait_hours: newWaitHours,
        }).eq("id", id);
      } catch (err) {
        console.error("Failed to snooze timer:", err);
      }
    }

    setCurrentTimerAlert(null);
    setScreen("dashboard");
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#F1F5F9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.75}}`}</style>

      {!authChecked && <LoadingScreen />}
      {authChecked && !session && !legalScreen && <AuthScreen onAuth={handleAuth} onLegal={setLegalScreen} />}
      {authChecked && !session && legalScreen === "privacy" && <PrivacyPolicy onBack={() => setLegalScreen(null)} />}
      {authChecked && !session && legalScreen === "terms" && <TermsOfService onBack={() => setLegalScreen(null)} />}
      {authChecked && session && !dataLoaded && <LoadingScreen />}

      {authChecked && session && dataLoaded && (
        <>
          {screen === "splash" && <SplashScreen onContinue={() => setScreen("checkin")} />}
          {screen === "checkin" && <CapacityCheckin onComplete={handleCheckinComplete} />}
          {screen === "dashboard" && <Dashboard mode={mode} setScreen={setScreen} spendLog={spendLog} pendingItems={waitingItems} readyItems={readyItems} checkins={checkins} onLogout={handleLogout} />}
          {screen === "decision" && <DecisionGate mode={mode} onBack={() => setScreen("dashboard")} onLog={handleLogEntry} />}
          {screen === "spend" && <SpendCheck mode={mode} onBack={() => setScreen("dashboard")} onWait={handleWait} onBuyNow={handleBuyNow} />}
          {screen === "quicklog" && <QuickLog onBack={() => setScreen("dashboard")} onLog={handleLogEntry} />}
          {screen === "transition" && <TransitionPicker onBack={() => setScreen("dashboard")} />}
          {screen === "history" && <DecisionLog spendLog={spendLog} onBack={() => setScreen("dashboard")} />}
          {screen === "patterns" && <Patterns checkins={checkins} spendLog={spendLog} onBack={() => setScreen("dashboard")} />}
          {screen === "timer-alert" && currentTimerAlert && <TimerAlert item={currentTimerAlert} onResolve={handleTimerResolve} onSnooze={handleSnooze} />}
        </>
      )}
    </div>
  );
}
