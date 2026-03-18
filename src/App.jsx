import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ============ SUPABASE CLIENT ============

const supabase = createClient(
  "https://iwzuvfaunhfcadqwiqpf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3enV2ZmF1bmhmY2FkcXdpcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDcyNDEsImV4cCI6MjA4OTMyMzI0MX0.lN5a3sPM4dBBGCCFGv1JqRQ-iQlqW5y1iqBizK7OKx0"
);

// ============ CONSTANTS ============

const MODES = {
  full: { label: "Full Day", color: "#4ADE80", bg: "#0A2E1A", emoji: "🟢", desc: "You're in good shape. Make the most of today.", focus: "Good day to tackle what matters. Make decisions with confidence." },
  light: { label: "Light Day", color: "#FBBF24", bg: "#2E2A0A", emoji: "🟡", desc: "Tools are available, but pay extra attention to warnings.", focus: "Protect your energy. Use Decision Gate before any emotional or expensive choice." },
  survival: { label: "Survival Day", color: "#F87171", bg: "#2E0A0A", emoji: "🔴", desc: "Protect yourself. No big decisions today.", focus: "Delay anything that can wait. Keep it simple. You'll have better days for big calls." },
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
  { q: "How fast is your brain moving right now?", options: [{ label: "Normal walking pace (I've been chewing on this)", flags: 0, color: "#4ADE80", bg: "#0A2E1A" }, { label: "100 miles per hour (I need this resolved *now*)", flags: 1, color: "#F87171", bg: "#2E0A0A" }] },
  { q: "Is your body physically taken care of right now?", options: [{ label: "Yes, I'm fed, rested, and comfortable", flags: 0, color: "#4ADE80", bg: "#0A2E1A" }, { label: "Honestly? I'm running on empty or overstimulated", flags: 1, color: "#F87171", bg: "#2E0A0A" }] },
  { q: "What actually happens if you don't decide this until tomorrow?", options: [{ label: "Actual disaster (missed hard deadline, safety)", flags: 0, color: "#4ADE80", bg: "#0A2E1A" }, { label: "Someone might get annoyed with me", flags: 1, color: "#FBBF24", bg: "#2E2A0A" }, { label: "Nothing real, I just want the pressure out of my head", flags: 1, color: "#F87171", bg: "#2E0A0A" }] }
];

const TRANSITIONS = {
  "Morning → Work": ["Close personal tabs and apps", "Get water or coffee", "Look at your top 3 tasks for today", "Pick the ONE thing to start with", "Set a 25-minute focus block"],
  "Work → Midday Break": ["Save your work and close intense tabs", "Stand up and stretch for 60 seconds", "Eat something — even if it's small", "Step outside or look out a window", "Check: how's your energy right now?"],
  "Midday → Afternoon": ["Review what you finished this morning", "Pick your top priority for the afternoon", "Refill water", "Put phone on Do Not Disturb if needed", "Start with the easiest task to build momentum"],
  "Work → Evening": ["Write down where you left off (30 seconds)", "Close all work tabs and apps", "Change clothes or wash your face", "Take 5 slow breaths", "You're done working — give yourself permission"],
  "Hyperfocus → Done": ["Save your work right now", "Stand up and move your body", "Drink water — you probably forgot", "Check the time — how long were you in?", "Do one easy unrelated task to shift gears"],
  "Overwhelm → Reset": ["Stop what you're doing", "Name one thing you're feeling out loud", "Take 5 slow breaths", "Pick the smallest possible next step", "Just do that one thing — nothing else"],
  "Task → Rest": ["Finish your current thought and save", "Close the tabs and apps", "Put your phone across the room", "Do something with your hands or body", "Give yourself 15 real minutes off"],
};

function timeRemaining(expiry) {
  const now = Date.now();
  const diff = expiry - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return Math.floor(hours / 24) + "d " + (hours % 24) + "h";
  return hours + "h " + mins + "m";
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
    setLoading(true); setError(null);
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session) onAuth(data.session); else setConfirmSent(true);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuth(data.session);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (confirmSent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>📧</span>
        <h2 style={screenTitle}>Check your email</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>
          We sent a confirmation link to <strong style={{ color: "#E2E8F0" }}>{email}</strong>. Click it to activate your account, then come back and log in.
        </p>
        <button onClick={() => { setConfirmSent(false); setIsSignUp(false); }} style={primaryBtn}>Back to login →</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9" /></svg>
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: "#F1F5F9", textAlign: "center", marginBottom: 12 }}>Decision Gate</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E2E8F0", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 8 }}>Learn when you make your best and worst decisions — and protect yourself on the bad days.</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 300, lineHeight: 1.5, marginBottom: 28 }}>{isSignUp ? "Create a free account to start tracking your decisions." : "Welcome back. Log in to pick up where you left off."}</p>
      {error && <div style={{ background: "#2E0A0A", border: "1px solid #F8717140", borderRadius: 12, padding: "10px 16px", marginBottom: 20, maxWidth: 320, width: "100%" }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F87171", margin: 0, textAlign: "center" }}>{error}</p></div>}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ ...inputStyle, marginBottom: 12 }} autoFocus />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inputStyle} onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }} />
      <button onClick={handleSubmit} disabled={loading || !email || !password} style={{ ...primaryBtn, marginTop: 24, opacity: (loading || !email || !password) ? 0.5 : 1 }}>{loading ? "..." : isSignUp ? "Create account →" : "Log in →"}</button>
      <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} style={{ marginTop: 16, background: "none", border: "none", color: "#6366F1", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", padding: "8px" }}>{isSignUp ? "Already have an account? Log in" : "New here? Create an account"}</button>
      <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <button onClick={() => onLegal("privacy")} style={{ background: "none", border: "none", color: "#334155", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</button>
        <button onClick={() => onLegal("terms")} style={{ background: "none", border: "none", color: "#334155", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</button>
      </div>
    </div>
  );
}

// ============ LOADING SCREEN ============

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9" /></svg>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#64748B" }}>Loading your data...</p>
    </div>
  );
}

// ============ LEGAL SCREENS ============

function PrivacyPolicy({ onBack }) {
  const s = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: "0 0 16px" };
  const h = { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: "#E2E8F0", margin: "24px 0 8px" };
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: "#F1F5F9", marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ ...s, color: "#64748B", marginBottom: 24 }}>Last updated: March 17, 2026</p>
      <h2 style={h}>What Decision Gate is</h2><p style={s}>Decision Gate is a daily decision-support tool. It is not medical software, therapy, or financial advice.</p>
      <h2 style={h}>What we collect</h2><p style={s}>When you create an account, we collect your email address and an encrypted password. We store the data you enter: check-in answers, spend entries, decisions, and timers.</p>
      <h2 style={h}>What we don't collect</h2><p style={s}>We do not collect your real name, location, financial account information, health records, or data from other apps. No ads, no tracking cookies.</p>
      <h2 style={h}>How we use your data</h2><p style={s}>Your data is used only to power the app for you. We do not sell, share, or give your data to anyone.</p>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12, marginBottom: 32 }}>← Back</button>
    </div>
  );
}

function TermsOfService({ onBack }) {
  const s = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: "0 0 16px" };
  const h = { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: "#E2E8F0", margin: "24px 0 8px" };
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: "#F1F5F9", marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ ...s, color: "#64748B", marginBottom: 24 }}>Last updated: March 17, 2026</p>
      <h2 style={h}>What you're agreeing to</h2><p style={s}>By creating an account, you agree to these terms. If you don't agree, don't use the app.</p>
      <h2 style={h}>What this app is — and isn't</h2><p style={s}>Decision Gate is a self-management tool. It is not medical advice, therapy, or financial advice. If you are in crisis, please call 988.</p>
      <h2 style={h}>Your decisions are yours</h2><p style={s}>The app provides prompts. You make all final decisions. We are not responsible for any outcomes resulting from decisions made while using the app.</p>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12, marginBottom: 32 }}>← Back</button>
    </div>
  );
}

// ============ SPLASH ============

function SplashScreen({ onContinue }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9" /></svg>
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: "#F1F5F9", textAlign: "center", marginBottom: 16 }}>Decision Gate</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0", textAlign: "center", maxWidth: 340, lineHeight: 1.6, marginBottom: 12 }}>Learn when you make your best and worst decisions — and protect yourself on the bad days.</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 40 }}>A 30-second daily check-in tracks your capacity, guards your spending, and builds a picture of your patterns.</p>
      <button onClick={onContinue} style={primaryBtn}>Start check-in →</button>
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
        <div style={{ height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: progress + "%", background: "#6366F1", borderRadius: 2, transition: "width 0.5s ease" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          {step > 0 ? <button onClick={handleBack} style={{ background: "none", border: "none", color: "#6366F1", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: "4px 0" }}>← Back</button> : <span />}
          <p style={{ color: "#64748B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{step + 1} of {questions.length}</p>
        </div>
      </div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 40, lineHeight: 1.3, maxWidth: 360 }}>{current.q}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
        {current.options.map(opt => (
          <button key={opt.label} onClick={() => handleAnswer(current.id, opt.value)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 24px", background: answers[current.id] === opt.value ? "#1E293B" : "#0F172A", border: answers[current.id] === opt.value ? "2px solid #6366F1" : "2px solid #1E293B", borderRadius: 16, cursor: "pointer", transition: "all 0.2s ease", width: "100%" }}>
            <span style={{ fontSize: 28 }}>{opt.icon}</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0", fontWeight: 500 }}>{opt.label}</span>
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
        {skipped && <div style={confettiContainer}>{["🎉", "💰", "✨", "🛡️", "💪"].map((e, i) => <span key={i} style={{ ...confettiPiece, left: (15 + i * 17) + "%", animationDelay: (i * 0.12) + "s" }}>{e}</span>)}</div>}
        <span style={{ fontSize: 64, marginBottom: 20 }}>{skipped ? "🛡️" : "👍"}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: skipped ? "#4ADE80" : "#FBBF24", textAlign: "center", marginBottom: 12 }}>{skipped ? "$" + item.amount.toLocaleString() + " saved!" : "Nice — that's a thoughtful purchase ✨"}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>{skipped ? "You waited, the urge passed, and you kept your money." : "You waited, thought it through, and decided it's worth it. That's the whole point."}</p>
        <button onClick={() => onResolve(item.id, resolved)} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <span style={{ fontSize: 52, marginBottom: 16 }}>⏰</span>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 8, maxWidth: 340, lineHeight: 1.3 }}>Timer's up</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#94A3B8", textAlign: "center", marginBottom: 6 }}>{item.item}</p>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: "#F1F5F9", textAlign: "center", marginBottom: 8 }}>${item.amount.toLocaleString()}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 36 }}>You logged this {item.waitHours} hours ago. Still want it?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        <button onClick={() => setResolved("skip")} style={gateBtn("#0A2E1A", "#4ADE80")}>Skip it — save ${item.amount.toLocaleString()}</button>
        <button onClick={() => setResolved("buy")} style={gateBtn("#1E293B", "#94A3B8")}>Buy it — I've thought it through</button>
        <button onClick={() => onSnooze(item.id)} style={{ padding: "16px 24px", background: "transparent", border: "1px solid #334155", borderRadius: 16, color: "#94A3B8", fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer", width: "100%" }}>Still not sure — add 24 more hours</button>
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
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const uniqueDays = [...new Set(checkins.map(c => { const d = new Date(c.created_at); d.setHours(0, 0, 0, 0); return d.getTime(); }))].sort((a, b) => b - a);
    const diffFromToday = Math.floor((today.getTime() - uniqueDays[0]) / (1000 * 60 * 60 * 24));
    if (diffFromToday <= 1) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        if (Math.floor((uniqueDays[i - 1] - uniqueDays[i]) / (1000 * 60 * 60 * 24)) === 1) streak++; else break;
      }
    }
  }

  // --- NEW LEARNING INSIGHT LOGIC ---
  let realTalkInsight = null;
  if (totalCheckins >= 3) {
    const recentCheckins = checkins.slice(0, 7);
    const survivalCount = recentCheckins.filter(c => c.mode === "survival").length;
    const badSleepCount = recentCheckins.filter(c => c.sleep === 1).length;
    const survivalSpend = spendEntries.filter(e => e.modeAtTime === "survival");
    const survivalSkipRate = survivalSpend.length > 0 ? Math.round((survivalSpend.filter(e => e.decision === "skip").length / survivalSpend.length) * 100) : null;
    
    if (survivalCount >= 4) {
       realTalkInsight = { icon: "🔋", title: "Running on Empty", text: `You've had ${survivalCount} Survival days recently. You are running a marathon right now. Keep your decisions as small as possible today.`, color: "#F87171", bg: "#2E0A0A" };
    } else if (badSleepCount >= 2 && survivalSkipRate !== null && survivalSkipRate < 50) {
       realTalkInsight = { icon: "⚠️", title: "Your Trigger", text: "You are more likely to impulse-buy on days you report Bad Sleep. Keep your wallet out of reach today.", color: "#FBBF24", bg: "#2E2A0A" };
    } else if (savedAmount > 0) {
       realTalkInsight = { icon: "🛡️", title: "Your Shield", text: "The wait timer is working for you. You are successfully blocking impulse buys when you force yourself to pause.", color: "#4ADE80", bg: "#0A2E1A" };
    } else {
       realTalkInsight = { icon: "🧠", title: "Finding Rhythm", text: "You are logging consistently. Keep using the tools and your patterns will continue to clear up.", color: "#818CF8", bg: "#171C4D" };
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "30px 20px 24px", maxWidth: 480, margin: "0 auto" }}>
      {/* HERO */}
      <section style={{ background: m.bg, border: "2px solid " + m.color + "30", borderRadius: 28, padding: "22px 20px", marginBottom: 18, boxShadow: "0 18px 36px rgba(0,0,0,0.16)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: m.color, boxShadow: `0 0 22px ${m.color}99` }} />
          <div>
            <p style={{ ...sectionLabel, margin: "0 0 4px", color: m.color + "AA" }}>Today</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 40, lineHeight: 1, fontWeight: 600, color: m.color, margin: 0 }}>{m.label}</h1>
          </div>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#D5DFEC", margin: "16px 0 18px", lineHeight: 1.5 }}>{m.desc}</p>
        <div style={{ background: "rgba(0,0,0,0.10)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 22, padding: "16px 16px" }}>
          <p style={{ ...sectionLabel, margin: "0 0 10px", color: "#A8C7B5" }}>Today’s focus</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#F1F5F9", margin: "0 0 16px", lineHeight: 1.55 }}>{m.focus}</p>
        </div>
      </section>

      {/* READY TIMER */}
      {hasReady && (
        <section style={{ background: "#11133A", border: "1px solid #3B3FD9", borderRadius: 24, padding: "18px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
            <div>
              <p style={{ ...sectionLabel, margin: "0 0 10px", color: "#8F95F6" }}>Needs attention</p>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#F1F5F9", margin: "0 0 10px", fontWeight: 700 }}>{readyItems.length} timer{readyItems.length > 1 ? "s are" : " is"} ready</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#B6C0D2", margin: 0, lineHeight: 1.5 }}>Review what you paused earlier.</p>
            </div>
            <button onClick={() => setScreen("timer-alert")} style={{ background: "#6366F1", border: "none", borderRadius: 16, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 18px", cursor: "pointer", flexShrink: 0 }}>Review</button>
          </div>
        </section>
      )}

      {/* PRIMARY ACTIONS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
        <button onClick={() => setScreen("decision")} style={{ ...primaryCardStyle, border: isLight ? "1px solid #FBBF2450" : isSurvival ? "1px solid #F8717150" : "1px solid #2A3655" }}>
          <div style={{ ...iconWrap, background: "rgba(74,222,128,0.08)" }}><span style={{ fontSize: 28 }}>🛡️</span></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Decision Gate</p></div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#93A4BD", margin: 0, lineHeight: 1.45 }}>Check whether now is a good time to decide.</p>
          </div>
        </button>
        <button onClick={() => setScreen("spend")} style={{ ...primaryCardStyle, border: isSurvival ? "1px solid #F8717150" : "1px solid #2A3655" }}>
          <div style={{ ...iconWrap, background: "rgba(251,191,36,0.08)" }}><span style={{ fontSize: 28 }}>💳</span></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Spend Check</p></div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#93A4BD", margin: 0, lineHeight: 1.45 }}>Pause purchases before impulse takes over.</p>
          </div>
        </button>
      </div>

      {/* NEW DYNAMIC LEARNING SECTION */}
      {totalCheckins > 0 && (
        <section style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 26, padding: "18px 18px", marginBottom: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p style={sectionLabel}>Learning</p>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#F8FAFC", margin: 0, fontWeight: 700 }}>Your Patterns</h2>
            </div>
            <button onClick={() => setScreen("patterns")} style={{ background: "none", border: "none", color: "#818CF8", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>See all</button>
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
              <p style={{ ...sectionLabel, fontSize: 10, letterSpacing: 3, margin: "0 0 10px" }}>Logged</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#F8FAFC", margin: "0 0 2px" }}>{totalCheckins}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8", margin: 0 }}>days</p>
            </div>
          </div>

          {realTalkInsight && (
            <div style={{ background: realTalkInsight.bg, border: `1px solid ${realTalkInsight.color}40`, borderRadius: 18, padding: "18px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{realTalkInsight.icon}</span>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: realTalkInsight.color, margin: 0, fontWeight: 700 }}>{realTalkInsight.title}</p>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>{realTalkInsight.text}</p>
            </div>
          )}
        </section>
      )}

      {/* PENDING TIMERS */}
      {pendingItems.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <p style={sectionLabel}>Waiting on</p>
          <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 24, padding: "16px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingItems.map(item => (
                <div key={item.id} style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 18, padding: "16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#F8FAFC", margin: 0, fontWeight: 600 }}>{item.item}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>${item.amount.toLocaleString()}</p>
                  </div>
                  <div style={{ background: "#171C4D", borderRadius: 14, padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#BFC8FF", fontWeight: 700 }}>
                    {timeRemaining(item.expiry) || "Ready"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MORE TOOLS */}
      <section style={{ marginBottom: 16 }}>
        <p style={sectionLabel}>More tools</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => setScreen("history")} style={secondaryCard}>
            <span style={{ fontSize: 22 }}>📊</span>
            <div style={{ flex: 1 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Decision Log</p></div>
          </button>
          <button onClick={() => setScreen("transition")} style={secondaryCard}>
            <span style={{ fontSize: 22 }}>🔄</span>
            <div style={{ flex: 1 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Change Gears</p></div>
          </button>
          <button onClick={() => setScreen("quicklog")} style={secondaryCard}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div style={{ flex: 1 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Quick Log</p></div>
          </button>
        </div>
      </section>

      {/* UTILITY */}
      <button onClick={() => setScreen("checkin")} style={{ width: "100%", padding: "18px", background: "transparent", border: "1px solid #334155", borderRadius: 20, color: "#CBD5E1", fontFamily: "'DM Sans', sans-serif", fontSize: 16, cursor: "pointer", marginBottom: 10 }}>Redo check-in</button>
      <button onClick={onLogout} style={{ width: "100%", padding: "8px", background: "transparent", border: "none", color: "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer" }}>Log out</button>
    </div>
  );
}

// ============ NEW DECISION GATE ============

function DecisionGate({ mode, onBack, onLog }) {
  const [phase, setPhase] = useState("select_type");
  const [decisionLabel, setDecisionLabel] = useState("");
  const [step, setStep] = useState(0);
  const [flags, setFlags] = useState(0);

  if (phase === "select_type") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {mode === "survival" && <div style={{ background: "#2E0A0A", border: "1px solid #F8717140", borderRadius: 12, padding: "10px 16px", marginBottom: 28 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F87171", margin: 0 }}>🔴 Survival mode — keep it simple today</p></div>}
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 24, maxWidth: 340, lineHeight: 1.4 }}>What kind of decision is this?</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
          {DECISION_TYPES.map(type => (
            <button key={type.id} onClick={() => { if (type.id === "custom") setPhase("custom_input"); else { setDecisionLabel(type.label); setPhase("grounding"); } }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 16, cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 24 }}>{type.icon}</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E2E8F0", fontWeight: 500 }}>{type.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 24 }}>← Cancel</button>
      </div>
    );
  }

  if (phase === "custom_input") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 16 }}>Write it out</h2>
        <textarea value={decisionLabel} onChange={e => setDecisionLabel(e.target.value)} placeholder="Briefly describe..." style={{ width: "100%", maxWidth: 320, minHeight: 120, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 14, color: "#F1F5F9", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical" }} autoFocus />
        <button onClick={() => setPhase("grounding")} disabled={!decisionLabel.trim()} style={{ ...primaryBtn, marginTop: 20, opacity: decisionLabel.trim() ? 1 : 0.4 }}>Next →</button>
      </div>
    );
  }

  if (phase === "grounding") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 32, maxWidth: 340, lineHeight: 1.4 }}>Okay. Before we look at this decision, do me a favor:</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 300, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}><span style={{ fontSize: 24 }}>🧘</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0" }}>Drop your shoulders.</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}><span style={{ fontSize: 24 }}>😌</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0" }}>Unclench your jaw.</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}><span style={{ fontSize: 24 }}>😮‍💨</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#E2E8F0" }}>Take one slow breath.</span></div>
        </div>
        <button onClick={() => setPhase("questions")} style={primaryBtn}>Done. Let's look at the decision →</button>
      </div>
    );
  }

  if (phase === "questions") {
    const current = GROUNDING_QUESTIONS[step];
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 36, maxWidth: 340, lineHeight: 1.4 }}>{current.q}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
          {current.options.map((opt, i) => (
            <button key={i} onClick={() => { setFlags(flags + opt.flags); if (step < GROUNDING_QUESTIONS.length - 1) setStep(step + 1); else setPhase("result"); }} style={gateBtn(opt.bg, opt.color)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const safe = (flags + (mode === "survival" ? 1 : mode === "light" ? 0.5 : 0)) <= 1;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>{safe ? "✅" : "🛑"}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: safe ? "#4ADE80" : "#FBBF24", textAlign: "center", marginBottom: 12 }}>{safe ? "Clear to proceed" : "Give yourself 24 hours"}</h2>
        <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12, padding: "12px 16px", marginBottom: 16, maxWidth: 320 }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", margin: 0, fontStyle: "italic" }}>"{decisionLabel}"</p></div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#94A3B8", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>{safe ? "You're in a solid headspace. You can trust your judgment on this right now. Take your time, and make the call." : "Your brain is spinning or your tank is empty. The smartest choice you can make right now is to put this in a box until tomorrow."}</p>
        <button onClick={() => { onLog({ type: "decision", item: decisionLabel, decision: safe ? "go" : "stop", flags: flags }); onBack(); }} style={primaryBtn}>{safe ? "Got it →" : "Save this for tomorrow →"}</button>
      </div>
    );
  }
}

// ============ SPEND CHECK ============

function SpendCheck({ mode, onBack, onWait, onBuyNow }) {
  const [step, setStep] = useState(0);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [needWant, setNeedWant] = useState(null);
  const [result, setResult] = useState(null);

  if (result) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <span style={{ fontSize: 64, marginBottom: 20 }}>{result === "nevermind" ? "🛡️" : result === "bought" ? "👍" : "⏳"}</span>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: result === "nevermind" ? "#4ADE80" : "#FBBF24", textAlign: "center", marginBottom: 12 }}>{result === "nevermind" ? "Saved!" : result === "bought" ? "Logged" : "Timer Set"}</h2>
      <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
    </div>
  );

  if (step === 0) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <h2 style={screenTitle}>What are you thinking of buying?</h2>
      <input type="text" value={item} onChange={e => setItem(e.target.value)} placeholder="e.g. New headphones" style={inputStyle} autoFocus />
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="How much? ($)" style={{ ...inputStyle, marginTop: 12 }} />
      <button onClick={() => { if (item && amount) setStep(1); }} disabled={!item || !amount} style={{ ...primaryBtn, marginTop: 24, opacity: item && amount ? 1 : 0.4 }}>Next →</button>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 16 }}>← Cancel</button>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <h2 style={screenTitle}>Is this a need or a want?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        <button onClick={() => { setNeedWant("need"); setStep(2); }} style={gateBtn("#0A2E1A", "#4ADE80")}>Need — I genuinely require this</button>
        <button onClick={() => { setNeedWant("want"); setStep(2); }} style={gateBtn("#2E2A0A", "#FBBF24")}>Want — I'd like it but could live without</button>
      </div>
      <button onClick={() => setStep(0)} style={{ ...backBtnStyle, marginTop: 32 }}>← Back</button>
    </div>
  );

  if (step === 2) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <h2 style={screenTitle}>Set a wait timer?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300, marginBottom: 20 }}>
        {[24, 48, 72].map(h => (
          <button key={h} onClick={() => { onWait({ item, amount: parseFloat(amount), needWant, waitHours: h }); setResult("waiting"); }} style={{ padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 14, cursor: "pointer", width: "100%" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 600, color: "#E2E8F0" }}>{h} hours</span>
          </button>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 300, borderTop: "1px solid #1E293B", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => { onBuyNow({ item, amount: parseFloat(amount), needWant, decision: "skip" }); setResult("nevermind"); }} style={{ width: "100%", padding: "14px", background: "#0A2E1A", border: "1px solid #4ADE8030", borderRadius: 12, color: "#4ADE80", cursor: "pointer" }}>Actually, I don't need it</button>
        <button onClick={() => { onBuyNow({ item, amount: parseFloat(amount), needWant, decision: "buy" }); setResult("bought"); }} style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid #334155", borderRadius: 12, color: "#94A3B8", cursor: "pointer" }}>Skip timer — buy it now</button>
      </div>
      <button onClick={() => { setStep(1); }} style={{ ...backBtnStyle, marginTop: 16 }}>← Back</button>
    </div>
  );
}

// ============ QUICK LOG ============

function QuickLog({ onBack, onLog }) {
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(0);

  if (step === 0) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <span style={{ fontSize: 36, marginBottom: 16 }}>⚡</span>
      <h2 style={screenTitle}>Quick log</h2>
      <input type="text" value={item} onChange={e => setItem(e.target.value)} placeholder="What was it?" style={inputStyle} autoFocus />
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="How much? ($)" style={{ ...inputStyle, marginTop: 12 }} />
      <button onClick={() => { if (item && amount) setStep(1); }} disabled={!item || !amount} style={{ ...primaryBtn, marginTop: 24, opacity: item && amount ? 1 : 0.4 }}>Next →</button>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 16 }}>← Cancel</button>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <h2 style={screenTitle}>What did you do?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        <button onClick={() => { onLog({ type: "spend", item, amount: parseFloat(amount), needWant: "quick log", decision: "skip" }); onBack(); }} style={gateBtn("#0A2E1A", "#4ADE80")}>I skipped it</button>
        <button onClick={() => { onLog({ type: "spend", item, amount: parseFloat(amount), needWant: "quick log", decision: "buy" }); onBack(); }} style={gateBtn("#1E293B", "#94A3B8")}>I bought it</button>
      </div>
    </div>
  );
}

// ============ NEW TRANSITIONS WIZARD ============

function TransitionPicker({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  if (selected) {
    const steps = TRANSITIONS[selected];
    const isDone = stepIndex >= steps.length;
    
    if (isDone) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={confettiContainer}>{["🎉", "✨", "🎯"].map((e, i) => <span key={i} style={{ ...confettiPiece, left: (30 + i * 20) + "%", animationDelay: (i * 0.1) + "s" }}>{e}</span>)}</div>
          <span style={{ fontSize: 64, marginBottom: 20 }}>🎯</span>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: "#4ADE80", textAlign: "center", marginBottom: 12 }}>Transition complete</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#94A3B8", textAlign: "center", marginBottom: 32 }}>Your brain is officially shifted. Good work.</p>
          <button onClick={onBack} style={primaryBtn}>Done — back to dashboard →</button>
        </div>
      );
    }

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Step {stepIndex + 1} of {steps.length}</p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 40, lineHeight: 1.3, maxWidth: 320 }}>{steps[stepIndex]}</h2>
        <button onClick={() => setStepIndex(stepIndex + 1)} style={primaryBtn}>Done → Next step</button>
        <button onClick={() => { setSelected(null); setStepIndex(0); }} style={{ ...backBtnStyle, marginTop: 40 }}>← Pick a different shift</button>
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
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E2E8F0", fontWeight: 500 }}>{key}</span><span style={{ color: "#334155", fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 28 }}>← Back to dashboard</button>
    </div>
  );
}

// ============ PATTERNS ============

function Patterns({ checkins, spendLog, onBack }) {
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>My Patterns</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 32 }}>Keep checking in daily to view your long-term patterns here.</p>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 12 }}>← Back to dashboard</button>
    </div>
  );
}

// ============ DECISION LOG ============

function DecisionLog({ spendLog, onBack }) {
  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>Decision Log</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...spendLog].reverse().map((entry, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12 }}>
            <div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E2E8F0", margin: 0 }}>{entry.item.substring(0,20)}...</p></div>
            <div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: entry.decision === "skip" || entry.decision === "go" ? "#4ADE80" : "#F87171", margin: 0 }}>{entry.decision}</p></div>
          </div>
        ))}
      </div>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 28 }}>← Back to dashboard</button>
    </div>
  );
}

// ============ STYLES ============

const screenTitle = { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#F1F5F9", textAlign: "center", marginBottom: 28, lineHeight: 1.3, maxWidth: 360 };
const inputStyle = { width: "100%", maxWidth: 320, padding: "16px 20px", background: "#0F172A", border: "2px solid #1E293B", borderRadius: 14, color: "#F1F5F9", fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none" };
const primaryBtn = { padding: "16px 32px", background: "#6366F1", border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", width: "100%", maxWidth: 320 };
const backBtnStyle = { padding: "12px 20px", background: "transparent", border: "1px solid #1E293B", borderRadius: 12, color: "#64748B", fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" };
const gateBtn = (bg, color) => ({ padding: "18px 24px", background: bg, border: "2px solid " + color + "30", borderRadius: 16, color: color, fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer", width: "100%", textAlign: "center", transition: "all 0.2s ease" });
const secondaryCard = { width: "100%", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left" };
const primaryCardStyle = { width: "100%", background: "#0F172A", border: "1px solid #2A3655", borderRadius: 22, padding: "18px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left", position: "relative", boxShadow: "0 10px 24px rgba(0,0,0,0.12)" };
const iconWrap = { width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.04)" };
const sectionLabel = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "0 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 4 };
const confettiContainer = { position: "fixed", top: 0, left: 0, right: 0, height: "100vh", pointerEvents: "none", zIndex: 100 };
const confettiPiece = { position: "absolute", top: "-20px", fontSize: 32, animation: "confettiFall 1.5s ease-out forwards" };

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
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); setAuthChecked(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setDataLoaded(false); return; }
    loadUserData(session.user.id);
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => setPendingItems(prev => [...prev]), 60000);
    return () => clearInterval(interval);
  }, []);

  const readyItems = pendingItems.filter(item => Date.now() >= item.expiry);
  const waitingItems = pendingItems.filter(item => Date.now() < item.expiry);

  useEffect(() => {
    if (screen === "timer-alert" && readyItems.length > 0 && !currentTimerAlert) setCurrentTimerAlert(readyItems[0]);
  }, [screen, readyItems, currentTimerAlert]);

  const loadUserData = async (userId) => {
    try {
      const { data: checkins } = await supabase.from("checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(90);
      const { data: spendRows } = await supabase.from("spend_entries").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      const { data: decisionRows } = await supabase.from("decision_entries").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      const { data: timerRows } = await supabase.from("pending_timers").select("*").eq("user_id", userId);

      const spendMapped = (spendRows || []).map(r => ({ type: "spend", item: r.item, amount: Number(r.amount), needWant: r.need_want, decision: r.decision, waitHours: r.wait_hours, date: new Date(r.created_at).toLocaleDateString(), modeAtTime: r.mode_at_time }));
      const decisionMapped = (decisionRows || []).map(r => ({ type: "decision", item: r.decision_text, decision: r.result, date: new Date(r.created_at).toLocaleDateString(), modeAtTime: r.mode_at_time }));
      setSpendLog([...spendMapped, ...decisionMapped].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setPendingItems((timerRows || []).map(r => ({ id: r.id, item: r.item, amount: Number(r.amount), needWant: r.need_want, waitHours: r.wait_hours, expiry: new Date(r.expires_at).getTime(), date: new Date(r.created_at).toLocaleDateString() })));
      const allCheckins = checkins || [];
      setCheckins(allCheckins);

      if (allCheckins.length > 0 && isToday(allCheckins[0].created_at)) { setMode(allCheckins[0].mode); setScreen("dashboard"); } 
      else if (allCheckins.length > 0) setScreen("checkin"); 
      else setScreen("splash");
      
      setDataLoaded(true);
    } catch (err) { setScreen("splash"); setDataLoaded(true); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); setScreen(null); setMode(null); setSpendLog([]); setPendingItems([]); setCheckins([]); setDataLoaded(false); };

  const handleCheckinComplete = async (m, answers, total) => {
    setMode(m); setScreen("dashboard");
    setCheckins(prev => [{ sleep: answers.sleep, energy: answers.energy, stress: answers.stress, emotion: answers.impulse, total_score: total, mode: m, created_at: new Date().toISOString() }, ...prev]);
    if (session) await supabase.from("checkins").insert({ user_id: session.user.id, sleep: answers.sleep, energy: answers.energy, stress: answers.stress, emotion: answers.impulse, total_score: total, mode: m });
  };

  const handleWait = async (entry) => {
    const expiresAt = new Date(Date.now() + entry.waitHours * 60 * 60 * 1000).toISOString();
    const tempId = Date.now().toString();
    setPendingItems(prev => [...prev, { id: tempId, item: entry.item, amount: entry.amount, needWant: entry.needWant, waitHours: entry.waitHours, expiry: Date.now() + entry.waitHours * 60 * 60 * 1000, date: new Date().toLocaleDateString() }]);
    if (session) {
      const { data } = await supabase.from("pending_timers").insert({ user_id: session.user.id, item: entry.item, amount: entry.amount, need_want: entry.needWant, wait_hours: entry.waitHours, expires_at: expiresAt, mode_at_time: mode }).select().single();
      if (data) setPendingItems(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
    }
  };

  const handleBuyNow = async (entry) => {
    setSpendLog(prev => [...prev, { type: "spend", item: entry.item, amount: entry.amount, needWant: entry.needWant, decision: entry.decision, date: new Date().toLocaleDateString(), modeAtTime: mode }]);
    if (session) await supabase.from("spend_entries").insert({ user_id: session.user.id, item: entry.item, amount: entry.amount, need_want: entry.needWant, decision: entry.decision, source: "spend_check", mode_at_time: mode });
  };

  const handleLogEntry = async (entry) => {
    if (entry.type === "decision") {
      setSpendLog(prev => [...prev, { type: "decision", item: entry.item, decision: entry.decision, date: new Date().toLocaleDateString(), modeAtTime: mode }]);
      if (session) await supabase.from("decision_entries").insert({ user_id: session.user.id, decision_text: entry.item, result: entry.decision, flags: entry.flags || 0, mode_at_time: mode });
    } else {
      setSpendLog(prev => [...prev, { type: "spend", item: entry.item, amount: entry.amount, needWant: entry.needWant, decision: entry.decision, date: new Date().toLocaleDateString(), modeAtTime: mode }]);
      if (session) await supabase.from("spend_entries").insert({ user_id: session.user.id, item: entry.item, amount: entry.amount, need_want: entry.needWant, decision: entry.decision, source: "quick_log", mode_at_time: mode });
    }
  };

  const handleTimerResolve = async (id, decision) => {
    const item = pendingItems.find(i => i.id === id);
    if (item) {
      setSpendLog(prev => [...prev, { type: "spend", item: item.item, amount: item.amount, needWant: item.needWant, decision, date: new Date().toLocaleDateString(), waitHours: item.waitHours, modeAtTime: mode }]);
      setPendingItems(prev => prev.filter(i => i.id !== id));
      if (session) {
        await supabase.from("spend_entries").insert({ user_id: session.user.id, item: item.item, amount: item.amount, need_want: item.needWant, decision, wait_hours: item.waitHours, source: "timer", mode_at_time: mode });
        await supabase.from("pending_timers").delete().eq("id", id);
      }
    }
    setCurrentTimerAlert(null); setScreen("dashboard");
  };

  const handleSnooze = async (id) => {
    const newExpiry = Date.now() + 24 * 60 * 60 * 1000;
    const currentItem = pendingItems.find(i => i.id === id);
    const newWaitHours = (currentItem?.waitHours || 0) + 24;
    setPendingItems(prev => prev.map(i => i.id === id ? { ...i, expiry: newExpiry, waitHours: newWaitHours } : i));
    if (session) await supabase.from("pending_timers").update({ expires_at: new Date(newExpiry).toISOString(), wait_hours: newWaitHours }).eq("id", id);
    setCurrentTimerAlert(null); setScreen("dashboard");
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#F1F5F9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>

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
