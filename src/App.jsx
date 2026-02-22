import { useState, useEffect } from "react";

const MODES = {
  full: { label: "Full Day", color: "#4ADE80", bg: "#0A2E1A", emoji: "🟢", desc: "You're in good shape. All tools available." },
  light: { label: "Light Day", color: "#FBBF24", bg: "#2E2A0A", emoji: "🟡", desc: "Go easy. Only essentials today." },
  survival: { label: "Survival Day", color: "#F87171", bg: "#2E0A0A", emoji: "🔴", desc: "Protect yourself. No big decisions today." },
};

const DECISION_QUESTIONS = [
  { q: "Am I calm or reactive right now?", good: "Calm", bad: "Reactive" },
  { q: "Have I slept and eaten today?", good: "Yes", bad: "No" },
  { q: "Can this wait 24 hours without real consequences?", good: "Yes, it can wait", bad: "No, it's urgent" },
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
};

// ============ COMPONENTS ============

function CapacityCheckin({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    { id: "sleep", q: "How did you sleep last night?", options: [
      { label: "Well", value: 3, icon: "😌" },
      { label: "OK", value: 2, icon: "😐" },
      { label: "Badly", value: 1, icon: "😩" },
    ]},
    { id: "energy", q: "What's your energy level right now?", options: [
      { label: "Good", value: 3, icon: "⚡" },
      { label: "Medium", value: 2, icon: "🔋" },
      { label: "Low", value: 1, icon: "🪫" },
    ]},
    { id: "stress", q: "Any high-stress events today?", options: [
      { label: "No", value: 3, icon: "😊" },
      { label: "Maybe", value: 2, icon: "😬" },
      { label: "Yes", value: 1, icon: "😰" },
    ]},
    { id: "impulse", q: "How are you feeling emotionally?", options: [
      { label: "Calm", value: 3, icon: "🧘" },
      { label: "A bit off", value: 2, icon: "🌊" },
      { label: "Reactive", value: 1, icon: "🔥" },
    ]},
  ];

  const handleAnswer = (id, value) => {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      const total = Object.values(newAnswers).reduce((a, b) => a + b, 0);
      let mode = "full";
      if (total <= 6) mode = "survival";
      else if (total <= 9) mode = "light";
      setTimeout(() => onComplete(mode), 500);
    }
  };

  const current = questions[step];
  const progress = ((step) / questions.length) * 100;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 40 }}>
        <div style={{ height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#6366F1", borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
        <p style={{ color: "#64748B", fontSize: 13, marginTop: 8, textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
          {step + 1} of {questions.length}
        </p>
      </div>

      <h2 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: 28,
        fontWeight: 500,
        color: "#F1F5F9",
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 1.3,
        maxWidth: 360,
      }}>
        {current.q}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
        {current.options.map((opt) => (
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
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              color: "#E2E8F0",
              fontWeight: 500,
            }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ mode, setScreen, spendLog }) {
  const m = MODES[mode];
  const savedAmount = spendLog
    .filter((e) => e.decision === "skip")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      {/* Mode Banner */}
      <div style={{
        background: m.bg,
        border: `2px solid ${m.color}30`,
        borderRadius: 20,
        padding: "28px 24px",
        marginBottom: 28,
        textAlign: "center",
      }}>
        <span style={{ fontSize: 36 }}>{m.emoji}</span>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 32,
          fontWeight: 600,
          color: m.color,
          margin: "12px 0 8px",
        }}>
          {m.label}
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: "#94A3B8",
          margin: 0,
          lineHeight: 1.5,
        }}>
          {m.desc}
        </p>
      </div>

      {/* Saved Money Banner */}
      {savedAmount > 0 && (
        <div style={{
          background: "#0A2E1A",
          border: "2px solid #4ADE8030",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>💰</span>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#4ADE80", margin: 0, fontWeight: 600 }}>
              Saved by waiting
            </p>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#4ADE80", margin: 0 }}>
              ${savedAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Tool Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ToolButton
          icon="🛡️"
          title="Decision Gate"
          subtitle="Should I make this decision right now?"
          onClick={() => setScreen("decision")}
          disabled={false}
        />
        <ToolButton
          icon="💳"
          title="Spend Check"
          subtitle="Thinking about buying something?"
          onClick={() => setScreen("spend")}
          disabled={false}
          warning={mode === "survival"}
          warningText="⚠️ Survival mode — be extra careful"
        />
        <ToolButton
          icon="🔄"
          title="Transition"
          subtitle="Help me switch what I'm doing"
          onClick={() => setScreen("transition")}
          disabled={false}
        />
        <ToolButton
          icon="📊"
          title="Spend History"
          subtitle={`${spendLog.length} entries logged`}
          onClick={() => setScreen("history")}
          disabled={false}
        />
      </div>

      {/* Reset Day */}
      <button
        onClick={() => setScreen("checkin")}
        style={{
          marginTop: 28,
          width: "100%",
          padding: "14px",
          background: "transparent",
          border: "1px solid #1E293B",
          borderRadius: 12,
          color: "#64748B",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Redo check-in →
      </button>
    </div>
  );
}

function ToolButton({ icon, title, subtitle, onClick, disabled, warning, warningText }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "20px 22px",
        background: disabled ? "#0A0F1A" : "#0F172A",
        border: warning ? "2px solid #F8717140" : "2px solid #1E293B",
        borderRadius: 18,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.2s ease",
        width: "100%",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 30, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 17,
          fontWeight: 600,
          color: "#F1F5F9",
          margin: 0,
        }}>{title}</p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: warning ? "#F87171" : "#64748B",
          margin: "4px 0 0",
        }}>{warning ? warningText : subtitle}</p>
      </div>
      <span style={{ color: "#334155", fontSize: 20 }}>›</span>
    </button>
  );
}

function DecisionGate({ mode, onBack }) {
  const [step, setStep] = useState(0);
  const [flags, setFlags] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (isBad) => {
    const newFlags = flags + (isBad ? 1 : 0);
    setFlags(newFlags);

    if (step < DECISION_QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setDone(true), 300);
    }
  };

  const modeFlag = mode === "survival" ? 1 : mode === "light" ? 0.5 : 0;
  const totalRisk = flags + modeFlag;

  if (done) {
    const safe = totalRisk <= 1;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>{safe ? "✅" : "🛑"}</span>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 28,
          fontWeight: 500,
          color: safe ? "#4ADE80" : "#F87171",
          textAlign: "center",
          marginBottom: 16,
        }}>
          {safe ? "OK to decide" : "Not right now"}
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: "#94A3B8",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          {safe
            ? "You seem to be in a reasonable headspace. Go ahead — but take it slow."
            : "Your brain isn't in the best place for this right now. Save it for tomorrow. The decision will still be there."}
        </p>
        <button onClick={onBack} style={backBtnStyle}>← Back to dashboard</button>
      </div>
    );
  }

  const current = DECISION_QUESTIONS[step];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {mode === "survival" && (
        <div style={{
          background: "#2E0A0A",
          border: "1px solid #F8717140",
          borderRadius: 12,
          padding: "10px 16px",
          marginBottom: 28,
        }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F87171", margin: 0 }}>
            🔴 You're in Survival mode — the bar is higher today
          </p>
        </div>
      )}

      <h2 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: 26,
        fontWeight: 500,
        color: "#F1F5F9",
        textAlign: "center",
        marginBottom: 36,
        maxWidth: 340,
        lineHeight: 1.4,
      }}>
        {current.q}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        <button onClick={() => handleAnswer(false)} style={gateBtn("#0A2E1A", "#4ADE80")}>
          {current.good}
        </button>
        <button onClick={() => handleAnswer(true)} style={gateBtn("#2E0A0A", "#F87171")}>
          {current.bad}
        </button>
      </div>

      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 40 }}>← Cancel</button>
    </div>
  );
}

function SpendCheck({ mode, onBack, onLog }) {
  const [step, setStep] = useState(0);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [needWant, setNeedWant] = useState(null);
  const [result, setResult] = useState(null);

  if (result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>{result === "skip" ? "🛡️" : "👍"}</span>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 26,
          fontWeight: 500,
          color: result === "skip" ? "#4ADE80" : "#FBBF24",
          textAlign: "center",
          marginBottom: 12,
        }}>
          {result === "skip" ? "Good call — skipping it" : "Logged — you decided to buy"}
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: "#94A3B8",
          textAlign: "center",
          maxWidth: 300,
          lineHeight: 1.5,
          marginBottom: 32,
        }}>
          {result === "skip"
            ? `$${parseFloat(amount).toLocaleString()} saved by waiting. That adds up.`
            : "No judgment. It's logged so you can see patterns over time."}
        </p>
        <button onClick={onBack} style={backBtnStyle}>← Back to dashboard</button>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {mode === "survival" && (
          <div style={{
            background: "#2E0A0A",
            border: "1px solid #F8717140",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 28,
            maxWidth: 340,
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#F87171", margin: 0, textAlign: "center" }}>
              🔴 Survival mode active — your brain wants to spend for relief right now. That's normal, but be careful.
            </p>
          </div>
        )}
        <h2 style={screenTitle}>What are you thinking of buying?</h2>
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="e.g. New headphones"
          style={inputStyle}
          autoFocus
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="How much? ($)"
          style={{ ...inputStyle, marginTop: 12 }}
        />
        <button
          onClick={() => { if (item && amount) setStep(1); }}
          disabled={!item || !amount}
          style={{ ...primaryBtn, marginTop: 24, opacity: item && amount ? 1 : 0.4 }}
        >
          Next →
        </button>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 16 }}>← Cancel</button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={screenTitle}>Is this a need or a want?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748B", marginBottom: 28, textAlign: "center" }}>
          {item} — ${parseFloat(amount).toLocaleString()}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
          <button onClick={() => { setNeedWant("need"); setStep(2); }} style={gateBtn("#0A2E1A", "#4ADE80")}>
            Need — I genuinely require this
          </button>
          <button onClick={() => { setNeedWant("want"); setStep(2); }} style={gateBtn("#2E2A0A", "#FBBF24")}>
            Want — I'd like it but could live without
          </button>
        </div>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 32 }}>← Cancel</button>
      </div>
    );
  }

  if (step === 2) {
    const shouldWarn = mode === "survival" || (mode === "light" && needWant === "want") || parseFloat(amount) > 200;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h2 style={screenTitle}>Can this wait 48 hours?</h2>
        {shouldWarn && (
          <div style={{
            background: "#2E2A0A",
            border: "1px solid #FBBF2440",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 24,
            maxWidth: 340,
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FBBF24", margin: 0, textAlign: "center" }}>
              {mode === "survival"
                ? "⚠️ You're in Survival mode. Strongly recommend waiting."
                : needWant === "want"
                ? "⚠️ This is a want, not a need. Consider waiting."
                : `⚠️ This is $${parseFloat(amount).toLocaleString()}. Big purchases deserve a clear head.`}
            </p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
          <button
            onClick={() => {
              onLog({ item, amount: parseFloat(amount), needWant, decision: "skip", date: new Date().toLocaleDateString() });
              setResult("skip");
            }}
            style={gateBtn("#0A2E1A", "#4ADE80")}
          >
            Yes — I'll wait
          </button>
          <button
            onClick={() => {
              onLog({ item, amount: parseFloat(amount), needWant, decision: "buy", date: new Date().toLocaleDateString() });
              setResult("buy");
            }}
            style={gateBtn("#2E0A0A", "#F87171")}
          >
            No — I'm buying it now
          </button>
        </div>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 32 }}>← Cancel</button>
      </div>
    );
  }
}

function TransitionPicker({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState({});

  if (selected) {
    const steps = TRANSITIONS[selected];
    const allDone = steps.every((_, i) => checked[i]);

    return (
      <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>{selected}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 28 }}>
          Take 2 minutes. Go through each step.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setChecked({ ...checked, [i]: !checked[i] })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                background: checked[i] ? "#0A2E1A" : "#0F172A",
                border: checked[i] ? "2px solid #4ADE8040" : "2px solid #1E293B",
                borderRadius: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
              }}
            >
              <div style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                border: checked[i] ? "2px solid #4ADE80" : "2px solid #334155",
                background: checked[i] ? "#4ADE8020" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}>
                {checked[i] && <span style={{ color: "#4ADE80", fontSize: 14 }}>✓</span>}
              </div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: checked[i] ? "#4ADE80" : "#E2E8F0",
                textDecoration: checked[i] ? "line-through" : "none",
                opacity: checked[i] ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}>{step}</span>
            </button>
          ))}
        </div>

        {allDone && (
          <div style={{
            background: "#0A2E1A",
            border: "2px solid #4ADE8030",
            borderRadius: 16,
            padding: "20px",
            marginTop: 24,
            textAlign: "center",
          }}>
            <span style={{ fontSize: 32 }}>🎯</span>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#4ADE80", margin: "8px 0 0" }}>
              Transition complete
            </p>
          </div>
        )}

        <button onClick={() => { setSelected(null); setChecked({}); }} style={{ ...backBtnStyle, marginTop: 24 }}>
          ← Back to transitions
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 8 }}>Switch modes</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748B", marginBottom: 28 }}>
        Pick the transition you're making right now.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.keys(TRANSITIONS).map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              background: "#0F172A",
              border: "2px solid #1E293B",
              borderRadius: 16,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: "#E2E8F0",
              fontWeight: 500,
            }}>{key}</span>
            <span style={{ color: "#334155", fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 28 }}>← Back to dashboard</button>
    </div>
  );
}

function SpendHistory({ spendLog, onBack }) {
  const saved = spendLog.filter((e) => e.decision === "skip");
  const bought = spendLog.filter((e) => e.decision === "buy");
  const totalSaved = saved.reduce((s, e) => s + e.amount, 0);
  const totalSpent = bought.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ ...screenTitle, textAlign: "left", marginBottom: 24 }}>Spend History</h2>

      {/* Stats */}
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

      {/* Win Rate */}
      {spendLog.length > 0 && (
        <div style={{
          background: "#0F172A",
          border: "1px solid #1E293B",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
          textAlign: "center",
        }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", margin: "0 0 4px" }}>
            Wait rate
          </p>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#6366F1", margin: 0 }}>
            {Math.round((saved.length / spendLog.length) * 100)}%
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>
            {saved.length} of {spendLog.length} impulses paused
          </p>
        </div>
      )}

      {/* Log entries */}
      {spendLog.length === 0 ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#475569", textAlign: "center", marginTop: 40 }}>
          No entries yet. Use the Spend Check when you're tempted.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...spendLog].reverse().map((entry, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "#0F172A",
                border: "1px solid #1E293B",
                borderRadius: 12,
              }}
            >
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E2E8F0", margin: 0, fontWeight: 500 }}>{entry.item}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
                  {entry.needWant} · {entry.date}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: entry.decision === "skip" ? "#4ADE80" : "#F87171",
                  margin: 0,
                  fontWeight: 600,
                }}>${entry.amount.toLocaleString()}</p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: entry.decision === "skip" ? "#4ADE80" : "#F87171",
                  margin: "2px 0 0",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>{entry.decision === "skip" ? "saved" : "bought"}</p>
              </div>
            </div>
          ))}
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
  border: `2px solid ${color}30`,
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

// ============ MAIN APP ============

export default function App() {
  const [screen, setScreen] = useState("checkin");
  const [mode, setMode] = useState(null);
  const [spendLog, setSpendLog] = useState([]);

  const handleCheckinComplete = (m) => {
    setMode(m);
    setScreen("dashboard");
  };

  const handleSpendLog = (entry) => {
    setSpendLog([...spendLog, entry]);
  };

  return (
    <div style={{
      background: "#020617",
      minHeight: "100vh",
      color: "#F1F5F9",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      
      {screen === "checkin" && (
        <CapacityCheckin onComplete={handleCheckinComplete} />
      )}
      {screen === "dashboard" && (
        <Dashboard mode={mode} setScreen={setScreen} spendLog={spendLog} />
      )}
      {screen === "decision" && (
        <DecisionGate mode={mode} onBack={() => setScreen("dashboard")} />
      )}
      {screen === "spend" && (
        <SpendCheck mode={mode} onBack={() => setScreen("dashboard")} onLog={handleSpendLog} />
      )}
      {screen === "transition" && (
        <TransitionPicker onBack={() => setScreen("dashboard")} />
      )}
      {screen === "history" && (
        <SpendHistory spendLog={spendLog} onBack={() => setScreen("dashboard")} />
      )}
    </div>
  );
}
