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

const MODE_TOOL_ORDER = {
  full: ["decision", "spend", "history", "transition"],
  light: ["decision", "spend", "history", "transition"],
  survival: ["spend", "decision", "history", "transition"],
};

const MODE_RECOMMENDED = {
  full: null,
  light: "decision",
  survival: "spend",
};

const TOOL_META = {
  decision: { icon: "🛡️", title: "Decision Gate", subtitle: "Should I make this decision right now?" },
  spend: { icon: "💳", title: "Spend Check", subtitle: "Thinking about buying something?" },
  transition: { icon: "🔄", title: "Change Gears", subtitle: "Help me switch what I'm doing" },
  history: { icon: "📊", title: "Decision Log", subtitleFn: (n) => n === 0 ? "Start building your pattern" : n + " entries — patterns building" },
};

const DECISION_QUESTIONS = [
  { q: "Am I calm or reactive right now?", good: "Calm", bad: "Reactive" },
  { q: "Have I slept and eaten today?", good: "Yes", bad: "No" },
  { q: "Am I rushing because of real urgency, or just pressure?", good: "Real deadline", bad: "Just feeling pressure" },
];

const TRANSITIONS = {
  "Morning → Work": ["Close personal tabs and apps","Get water or coffee","Look at your top 3 tasks for today","Pick the ONE thing to start with","Set a 25-minute focus block"],
  "Work → Midday Break": ["Save your work and close intense tabs","Stand up and stretch for 60 seconds","Eat something — even if it's small","Step outside or look out a window","Check: how's your energy right now?"],
  "Midday → Afternoon": ["Review what you finished this morning","Pick your top priority for the afternoon","Refill water","Put phone on Do Not Disturb if needed","Start with the easiest task to build momentum"],
  "Work → Evening": ["Write down where you left off (30 seconds)","Close all work tabs and apps","Change clothes or wash your face","Take 5 slow breaths","You're done working — give yourself permission"],
  "Hyperfocus → Done": ["Save your work right now","Stand up and move your body","Drink water — you probably forgot","Check the time — how long were you in?","Do one easy unrelated task to shift gears"],
  "Overwhelm → Reset": ["Stop what you're doing","Name one thing you're feeling out loud","Take 5 slow breaths","Pick the smallest possible next step","Just do that one thing — nothing else"],
  "Task → Rest": ["Finish your current thought and save","Close the tabs and apps","Put your phone across the room","Do something with your hands or body","Give yourself 15 real minutes off"],
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
  if (hours >= 24) { return Math.floor(hours / 24) + "d " + (hours % 24) + "h"; }
  return hours + "h " + mins + "m";
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ============ AUTH SCREEN ============

function AuthScreen({ onAuth }) {
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
        if (data.session) {
          onAuth(data.session);
        } else {
          setConfirmSent(true);
        }
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
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
        <span style={{fontSize:48,marginBottom:16}}>📧</span>
        <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#F1F5F9",textAlign:"center",marginBottom:12}}>Check your email</h2>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#94A3B8",textAlign:"center",maxWidth:320,lineHeight:1.6,marginBottom:24}}>We sent a confirmation link to <strong style={{color:"#E2E8F0"}}>{email}</strong>. Click it to activate your account, then come back and log in.</p>
        <button onClick={()=>{setConfirmSent(false);setIsSignUp(false);}} style={primaryBtn}>Back to login →</button>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{width:72,height:72,borderRadius:20,background:"#6366F1",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24}}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9"/></svg>
      </div>
      <h1 style={{fontFamily:"'Fraunces', serif",fontSize:34,fontWeight:600,color:"#F1F5F9",textAlign:"center",marginBottom:8}}>Decision Gate</h1>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#64748B",textAlign:"center",maxWidth:300,lineHeight:1.5,marginBottom:32}}>
        {isSignUp ? "Create your account to start tracking your decisions." : "Welcome back. Log in to pick up where you left off."}
      </p>
      {error && (<div style={{background:"#2E0A0A",border:"1px solid #F8717140",borderRadius:12,padding:"10px 16px",marginBottom:20,maxWidth:320,width:"100%"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#F87171",margin:0,textAlign:"center"}}>{error}</p></div>)}
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{...inputStyle,marginBottom:12}} autoFocus />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={inputStyle} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} />
      <button onClick={handleSubmit} disabled={loading||!email||!password} style={{...primaryBtn,marginTop:24,opacity:(loading||!email||!password)?0.5:1}}>
        {loading ? "..." : isSignUp ? "Create account →" : "Log in →"}
      </button>
      <button onClick={()=>{setIsSignUp(!isSignUp);setError(null);}} style={{marginTop:16,background:"none",border:"none",color:"#6366F1",fontFamily:"'DM Sans', sans-serif",fontSize:14,cursor:"pointer",padding:"8px"}}>
        {isSignUp ? "Already have an account? Log in" : "New here? Create an account"}
      </button>
    </div>
  );
}

// ============ LOADING SCREEN ============

function LoadingScreen() {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:72,height:72,borderRadius:20,background:"#6366F1",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24}}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9"/></svg>
      </div>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:16,color:"#64748B"}}>Loading your data...</p>
    </div>
  );
}

// ============ SPLASH ============

function SplashScreen({ onContinue }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{width:72,height:72,borderRadius:20,background:"#6366F1",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24}}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 4L30 10V20C30 27 24.5 32.5 18 34C11.5 32.5 6 27 6 20V10L18 4Z" fill="#F1F5F9"/></svg>
      </div>
      <h1 style={{fontFamily:"'Fraunces', serif",fontSize:34,fontWeight:600,color:"#F1F5F9",textAlign:"center",marginBottom:16}}>Decision Gate</h1>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:18,color:"#E2E8F0",textAlign:"center",maxWidth:340,lineHeight:1.6,marginBottom:12}}>
        Learn when you make your best and worst decisions — and protect yourself on the bad days.
      </p>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#64748B",textAlign:"center",maxWidth:320,lineHeight:1.6,marginBottom:40}}>
        A 30-second daily check-in tracks your capacity, guards your spending, and builds a picture of your decision patterns over time.
      </p>
      <button onClick={onContinue} style={{padding:"18px 48px",background:"#6366F1",border:"none",borderRadius:16,color:"#fff",fontSize:17,fontFamily:"'DM Sans', sans-serif",fontWeight:600,cursor:"pointer",width:"100%",maxWidth:320}}>
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
    {id:"sleep",q:"How did you sleep last night?",options:[{label:"Well",value:3,icon:"😌"},{label:"OK",value:2,icon:"😐"},{label:"Badly",value:1,icon:"😩"}]},
    {id:"energy",q:"What's your energy level right now?",options:[{label:"Good",value:3,icon:"⚡"},{label:"Medium",value:2,icon:"🔋"},{label:"Low",value:1,icon:"🪫"}]},
    {id:"stress",q:"Any high-stress events today?",options:[{label:"No",value:3,icon:"😊"},{label:"Maybe",value:2,icon:"😬"},{label:"Yes",value:1,icon:"😰"}]},
    {id:"impulse",q:"How are you feeling emotionally?",options:[{label:"Calm",value:3,icon:"🧘"},{label:"A bit off",value:2,icon:"🌊"},{label:"Reactive",value:1,icon:"🔥"}]},
  ];
  const handleAnswer = (id, value) => {
    const na = {...answers,[id]:value};
    setAnswers(na);
    if (step < questions.length - 1) { setTimeout(()=>setStep(step+1),300); }
    else {
      const total = Object.values(na).reduce((a,b)=>a+b,0);
      let mode = "full";
      if (total <= 6) mode = "survival";
      else if (total <= 9) mode = "light";
      setTimeout(()=>onComplete(mode, na, total),500);
    }
  };
  const handleBack = () => {
    if (step > 0) { const p=questions[step-1]; const na={...answers}; delete na[p.id]; setAnswers(na); setStep(step-1); }
  };
  const current = questions[step];
  const progress = ((step+1)/questions.length)*100;
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"100%",maxWidth:400,marginBottom:40}}>
        <div style={{height:4,background:"#1E293B",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:progress+"%",background:"#6366F1",borderRadius:2,transition:"width 0.5s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          {step>0?(<button onClick={handleBack} style={{background:"none",border:"none",color:"#6366F1",fontFamily:"'DM Sans', sans-serif",fontSize:13,cursor:"pointer",padding:"4px 0"}}>← Back</button>):<span/>}
          <p style={{color:"#64748B",fontSize:13,fontFamily:"'DM Sans', sans-serif"}}>{step+1} of {questions.length}</p>
        </div>
      </div>
      <h2 style={{fontFamily:"'Fraunces', serif",fontSize:28,fontWeight:500,color:"#F1F5F9",textAlign:"center",marginBottom:40,lineHeight:1.3,maxWidth:360}}>{current.q}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:320}}>
        {current.options.map(opt=>(
          <button key={opt.label} onClick={()=>handleAnswer(current.id,opt.value)} style={{display:"flex",alignItems:"center",gap:14,padding:"18px 24px",background:answers[current.id]===opt.value?"#1E293B":"#0F172A",border:answers[current.id]===opt.value?"2px solid #6366F1":"2px solid #1E293B",borderRadius:16,cursor:"pointer",transition:"all 0.2s ease",width:"100%"}}>
            <span style={{fontSize:28}}>{opt.icon}</span>
            <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:18,color:"#E2E8F0",fontWeight:500}}>{opt.label}</span>
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
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        {skipped&&<div style={confettiContainer}>{["🎉","💰","✨","🛡️","💪"].map((e,i)=>(<span key={i} style={{...confettiPiece,left:(15+i*17)+"%",animationDelay:(i*0.12)+"s"}}>{e}</span>))}</div>}
        <span style={{fontSize:64,marginBottom:20}}>{skipped?"🛡️":"👍"}</span>
        <h2 style={{fontFamily:"'Fraunces', serif",fontSize:28,fontWeight:500,color:skipped?"#4ADE80":"#FBBF24",textAlign:"center",marginBottom:12}}>{skipped?"$"+item.amount.toLocaleString()+" saved!":"Nice — that's a thoughtful purchase ✨"}</h2>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:16,color:"#94A3B8",textAlign:"center",maxWidth:320,lineHeight:1.6,marginBottom:32}}>{skipped?"You waited, the urge passed, and you kept your money.":"You waited, thought it through, and decided it's worth it. That's the whole point."}</p>
        <button onClick={()=>onResolve(item.id,resolved)} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <span style={{fontSize:52,marginBottom:16}}>⏰</span>
      <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#F1F5F9",textAlign:"center",marginBottom:8,maxWidth:340,lineHeight:1.3}}>Timer's up</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:18,color:"#94A3B8",textAlign:"center",marginBottom:6}}>{item.item}</p>
      <p style={{fontFamily:"'Fraunces', serif",fontSize:32,color:"#F1F5F9",textAlign:"center",marginBottom:8}}>${item.amount.toLocaleString()}</p>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",textAlign:"center",marginBottom:36}}>You logged this {item.waitHours} hours ago. Still want it?</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:300}}>
        <button onClick={()=>setResolved("skip")} style={gateBtn("#0A2E1A","#4ADE80")}>Skip it — save ${item.amount.toLocaleString()}</button>
        <button onClick={()=>setResolved("buy")} style={gateBtn("#1E293B","#94A3B8")}>Buy it — I've thought it through</button>
        <button onClick={()=>onSnooze(item.id)} style={{padding:"16px 24px",background:"transparent",border:"1px solid #334155",borderRadius:16,color:"#94A3B8",fontSize:15,fontFamily:"'DM Sans', sans-serif",fontWeight:500,cursor:"pointer",width:"100%",textAlign:"center"}}>Still not sure — add 24 more hours</button>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============

function Dashboard({ mode, setScreen, spendLog, pendingItems, readyItems, onLogout }) {
  const m = MODES[mode];
  const savedAmount = spendLog.filter(e=>e.decision==="skip").reduce((s,e)=>s+(e.amount||0),0);
  const hasReady = readyItems.length > 0;
  const toolOrder = MODE_TOOL_ORDER[mode];
  const recommended = MODE_RECOMMENDED[mode];

  return (
    <div style={{minHeight:"100vh",padding:"32px 20px",maxWidth:480,margin:"0 auto"}}>
      {/* Mode Banner */}
      <div style={{background:m.bg,border:"2px solid "+m.color+"30",borderRadius:20,padding:"28px 24px",marginBottom:20,textAlign:"center"}}>
        <span style={{fontSize:36}}>{m.emoji}</span>
        <h1 style={{fontFamily:"'Fraunces', serif",fontSize:32,fontWeight:600,color:m.color,margin:"12px 0 8px"}}>{m.label}</h1>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#94A3B8",margin:0,lineHeight:1.5}}>{m.desc}</p>
      </div>

      {/* Today's Focus */}
      <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:"14px 18px",marginBottom:20}}>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#64748B",margin:"0 0 4px",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Today's focus</p>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#E2E8F0",margin:0,lineHeight:1.5}}>{m.focus}</p>
      </div>

      {/* Timer Alert */}
      {hasReady&&(<button onClick={()=>setScreen("timer-alert")} style={{width:"100%",padding:"16px 20px",background:"#1A1A2E",border:"2px solid #6366F1",borderRadius:16,marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:14,animation:"pulse 2s ease-in-out infinite"}}>
        <span style={{fontSize:28}}>⏰</span>
        <div style={{flex:1,textAlign:"left"}}>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,fontWeight:600,color:"#6366F1",margin:0}}>{readyItems.length} timer{readyItems.length>1?"s":""} up!</p>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#94A3B8",margin:"2px 0 0"}}>Tap to decide — still want {readyItems.length>1?"them":"it"}?</p>
        </div>
        <span style={{color:"#6366F1",fontSize:20}}>›</span>
      </button>)}

      {/* Saved Banner */}
      {savedAmount>0&&(<div style={{background:"#0A2E1A",border:"2px solid #4ADE8030",borderRadius:16,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>💰</span>
        <div><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#4ADE80",margin:0,fontWeight:600}}>Saved by waiting</p><p style={{fontFamily:"'Fraunces', serif",fontSize:24,color:"#4ADE80",margin:0}}>${savedAmount.toLocaleString()}</p></div>
      </div>)}

      {/* Pending Timers */}
      {pendingItems.length>0&&(<div style={{marginBottom:20}}>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#64748B",marginBottom:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Waiting on</p>
        {pendingItems.map(item=>{const remaining=timeRemaining(item.expiry);return(
          <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,marginBottom:8}}>
            <div><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#E2E8F0",margin:0}}>{item.item}</p><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#64748B",margin:"2px 0 0"}}>${item.amount.toLocaleString()}</p></div>
            <div style={{background:"#1E293B",borderRadius:8,padding:"6px 12px"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#6366F1",margin:0,fontWeight:600}}>{remaining||"Ready!"}</p></div>
          </div>);})}
      </div>)}

      {/* Tools */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {toolOrder.map(toolKey => {
          const t = TOOL_META[toolKey];
          const isRecommended = recommended === toolKey;
          const isSurvivalSpend = mode === "survival" && toolKey === "spend";
          const subtitle = toolKey === "history" ? t.subtitleFn(spendLog.length) : t.subtitle;
          return (
            <button key={toolKey} onClick={()=>setScreen(toolKey === "history" ? "history" : toolKey === "transition" ? "transition" : toolKey)}
              style={{display:"flex",alignItems:"center",gap:16,padding:"20px 22px",background:isRecommended?"#0F172A":"#0F172A",border:isRecommended?"2px solid "+MODES[mode].color+"50":isSurvivalSpend?"2px solid #F8717140":"2px solid #1E293B",borderRadius:18,cursor:"pointer",transition:"all 0.2s ease",width:"100%",textAlign:"left",position:"relative"}}>
              {isRecommended&&(<div style={{position:"absolute",top:-10,right:16,background:MODES[mode].color,borderRadius:8,padding:"2px 10px"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:11,fontWeight:700,color:"#020617",margin:0,textTransform:"uppercase",letterSpacing:0.5}}>Recommended</p></div>)}
              <span style={{fontSize:30,flexShrink:0}}>{t.icon}</span>
              <div style={{flex:1}}>
                <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:17,fontWeight:600,color:"#F1F5F9",margin:0}}>{t.title}</p>
                <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:isSurvivalSpend?"#F87171":"#64748B",margin:"4px 0 0"}}>{isSurvivalSpend?"⚠️ Survival mode — be extra careful":subtitle}</p>
              </div>
              <span style={{color:"#334155",fontSize:20}}>›</span>
            </button>
          );
        })}
      </div>

      <button onClick={()=>setScreen("quicklog")} style={{marginTop:20,width:"100%",padding:"14px 22px",background:"#0F172A",border:"2px solid #1E293B",borderRadius:14,color:"#E2E8F0",fontFamily:"'DM Sans', sans-serif",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
        <span style={{fontSize:16}}>⚡</span> Quick log a purchase I already made
      </button>

      <button onClick={()=>setScreen("checkin")} style={{marginTop:12,width:"100%",padding:"14px",background:"transparent",border:"1px solid #1E293B",borderRadius:12,color:"#64748B",fontFamily:"'DM Sans', sans-serif",fontSize:14,cursor:"pointer"}}>Redo check-in →</button>

      <button onClick={onLogout} style={{marginTop:8,width:"100%",padding:"12px",background:"transparent",border:"none",color:"#334155",fontFamily:"'DM Sans', sans-serif",fontSize:13,cursor:"pointer"}}>Log out</button>
    </div>
  );
}

// ============ DECISION GATE ============

function DecisionGate({ mode, onBack, onLog }) {
  const [decisionText,setDecisionText]=useState("");
  const [started,setStarted]=useState(false);
  const [step,setStep]=useState(0);
  const [flags,setFlags]=useState(0);
  const [answerHistory,setAnswerHistory]=useState([]);
  const [finalFlags,setFinalFlags]=useState(null);
  const [done,setDone]=useState(false);
  const [nextAction]=useState(()=>({stop:randomFrom(NEXT_ACTIONS_STOP),go:randomFrom(NEXT_ACTIONS_GO)}));

  if (!started) {
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        {mode==="survival"&&(<div style={{background:"#2E0A0A",border:"1px solid #F8717140",borderRadius:12,padding:"10px 16px",marginBottom:28}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#F87171",margin:0}}>🔴 You're in Survival mode — the bar is higher today</p></div>)}
        <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#F1F5F9",textAlign:"center",marginBottom:12,maxWidth:340,lineHeight:1.4}}>What decision are you weighing?</h2>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",textAlign:"center",maxWidth:300,lineHeight:1.5,marginBottom:24}}>Writing it out helps. Be specific.</p>
        <textarea value={decisionText} onChange={e=>setDecisionText(e.target.value)} placeholder="e.g. Should I quit my job? Should I have that difficult conversation? Should I commit to this move?" style={{width:"100%",maxWidth:340,minHeight:120,padding:"16px 20px",background:"#0F172A",border:"2px solid #1E293B",borderRadius:14,color:"#F1F5F9",fontSize:15,fontFamily:"'DM Sans', sans-serif",outline:"none",resize:"vertical",lineHeight:1.5}} autoFocus/>
        <button onClick={()=>setStarted(true)} disabled={!decisionText.trim()} style={{...primaryBtn,marginTop:20,opacity:decisionText.trim()?1:0.4}}>Check if I should decide now →</button>
        <button onClick={onBack} style={{...backBtnStyle,marginTop:16}}>← Cancel</button>
      </div>
    );
  }
  const handleAnswer=(isBad)=>{
    const nf=flags+(isBad?1:0);
    setFlags(nf);
    setAnswerHistory([...answerHistory,isBad?1:0]);
    if(step<DECISION_QUESTIONS.length-1){setTimeout(()=>setStep(step+1),300);}
    else{setFinalFlags(nf);setTimeout(()=>setDone(true),300);}
  };
  const handleGateBack=()=>{
    if(step>0){
      const prevValue=answerHistory[answerHistory.length-1]||0;
      setFlags(flags-prevValue);
      setAnswerHistory(answerHistory.slice(0,-1));
      setStep(step-1);
    }
    else{setStarted(false);}
  };
  const modeFlag=mode==="survival"?1:mode==="light"?0.5:0;
  const totalRisk=(finalFlags!==null?finalFlags:flags)+modeFlag;
  if (done) {
    const safe = totalRisk <= 1;
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <span style={{fontSize:64,marginBottom:20}}>{safe?"✅":"🛑"}</span>
        <h2 style={{fontFamily:"'Fraunces', serif",fontSize:28,fontWeight:500,color:safe?"#4ADE80":"#F87171",textAlign:"center",marginBottom:12}}>{safe?"OK to decide":"Not the right time"}</h2>
        <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"12px 16px",marginBottom:16,maxWidth:320}}>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#94A3B8",margin:0,fontStyle:"italic"}}>"{decisionText}"</p>
        </div>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#94A3B8",textAlign:"center",maxWidth:320,lineHeight:1.6,marginBottom:16}}>
          {safe?"You're in a reasonable headspace. Go ahead — but take it slow.":"This decision will still be there when you're in a better place to think it through."}
        </p>
        <div style={{background:safe?"#0A2E1A":"#1E1A2E",border:safe?"1px solid #4ADE8030":"1px solid #6366F130",borderRadius:14,padding:"16px 18px",maxWidth:320,marginBottom:32}}>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:safe?"#4ADE80":"#A5B4FC",margin:"0 0 6px",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Next step</p>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#E2E8F0",margin:0,lineHeight:1.5}}>{safe?nextAction.go:nextAction.stop}</p>
        </div>
        <button onClick={()=>{onLog({type:"decision",item:decisionText,decision:safe?"go":"stop",flags:finalFlags});onBack();}} style={backBtnStyle}>← Back to dashboard</button>
      </div>
    );
  }
  const current=DECISION_QUESTIONS[step];
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:10,padding:"8px 14px",marginBottom:28,maxWidth:320}}>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#64748B",margin:0}}>Deciding: <span style={{color:"#94A3B8"}}>{decisionText.length>40?decisionText.substring(0,40)+"...":decisionText}</span></p>
      </div>
      <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#F1F5F9",textAlign:"center",marginBottom:36,maxWidth:340,lineHeight:1.4}}>{current.q}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:300}}>
        <button onClick={()=>handleAnswer(false)} style={gateBtn("#0A2E1A","#4ADE80")}>{current.good}</button>
        <button onClick={()=>handleAnswer(true)} style={gateBtn("#2E0A0A","#F87171")}>{current.bad}</button>
      </div>
      <button onClick={handleGateBack} style={{...backBtnStyle,marginTop:40}}>{step>0?"← Back":"← Edit decision"}</button>
    </div>
  );
}

// ============ SPEND CHECK ============

function SpendCheck({ mode, onBack, onWait, onBuyNow }) {
  const [step,setStep]=useState(0);
  const [item,setItem]=useState("");
  const [amount,setAmount]=useState("");
  const [needWant,setNeedWant]=useState(null);
  const [waitHours,setWaitHours]=useState(null);
  const [result,setResult]=useState(null);

  if (result==="waiting") {
    return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <span style={{fontSize:64,marginBottom:20}}>⏳</span>
      <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#6366F1",textAlign:"center",marginBottom:12}}>Timer set — {waitHours} hours</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:16,color:"#94A3B8",textAlign:"center",maxWidth:320,lineHeight:1.6,marginBottom:8}}>We'll check back on <strong style={{color:"#E2E8F0"}}>{item}</strong> (${parseFloat(amount).toLocaleString()}) when your timer is up.</p>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",textAlign:"center",maxWidth:300,lineHeight:1.5,marginBottom:32}}>If you still want it then, buy it with confidence. If not, you just saved ${parseFloat(amount).toLocaleString()}.</p>
      <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
    </div>);
  }
  if (result==="bought") {
    return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <span style={{fontSize:64,marginBottom:20}}>👍</span>
      <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#FBBF24",textAlign:"center",marginBottom:12}}>Logged — you decided to buy now</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#94A3B8",textAlign:"center",maxWidth:300,lineHeight:1.5,marginBottom:32}}>It's logged so you can see patterns over time.</p>
      <button onClick={onBack} style={backBtnStyle}>← Back to dashboard</button>
    </div>);
  }
  if (result==="nevermind") {
    return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={confettiContainer}>{["🎉","💰","✨","🛡️","💪"].map((e,i)=>(<span key={i} style={{...confettiPiece,left:(15+i*17)+"%",animationDelay:(i*0.12)+"s"}}>{e}</span>))}</div>
      <span style={{fontSize:64,marginBottom:20}}>🛡️</span>
      <h2 style={{fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#4ADE80",textAlign:"center",marginBottom:12}}>${parseFloat(amount).toLocaleString()} saved!</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:16,color:"#94A3B8",textAlign:"center",maxWidth:320,lineHeight:1.6,marginBottom:32}}>You thought it through and realized you don't need it. That's a win.</p>
      <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
    </div>);
  }
  if (step===0) {
    return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      {mode==="survival"&&(<div style={{background:"#2E0A0A",border:"1px solid #F8717140",borderRadius:12,padding:"12px 16px",marginBottom:28,maxWidth:340}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#F87171",margin:0,textAlign:"center"}}>🔴 Survival mode — impulse spending is more likely right now. Take it slow.</p></div>)}
      <h2 style={screenTitle}>What are you thinking of buying?</h2>
      <input type="text" value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. New headphones" style={inputStyle} autoFocus/>
      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="How much? ($)" style={{...inputStyle,marginTop:12}}/>
      <button onClick={()=>{if(item&&amount)setStep(1);}} disabled={!item||!amount} style={{...primaryBtn,marginTop:24,opacity:item&&amount?1:0.4}}>Next →</button>
      <button onClick={onBack} style={{...backBtnStyle,marginTop:16}}>← Cancel</button>
    </div>);
  }
  if (step===1) {
    return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <h2 style={screenTitle}>Is this a need or a want?</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#64748B",marginBottom:28,textAlign:"center"}}>{item} — ${parseFloat(amount).toLocaleString()}</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:300}}>
        <button onClick={()=>{setNeedWant("need");setStep(2);}} style={gateBtn("#0A2E1A","#4ADE80")}>Need — I genuinely require this</button>
        <button onClick={()=>{setNeedWant("want");setStep(2);}} style={gateBtn("#2E2A0A","#FBBF24")}>Want — I'd like it but could live without</button>
      </div>
      <button onClick={()=>setStep(0)} style={{...backBtnStyle,marginTop:32}}>← Back</button>
    </div>);
  }
  if (step===2) {
    const shouldWarn=mode==="survival"||(mode==="light"&&needWant==="want")||parseFloat(amount)>200;
    const suggestedWait=parseFloat(amount)>500?72:parseFloat(amount)>100?48:24;
    return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <h2 style={screenTitle}>Set a wait timer?</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",textAlign:"center",maxWidth:300,lineHeight:1.5,marginBottom:8}}>We'll check back and ask if you still want it.</p>
      {shouldWarn&&(<div style={{background:"#2E2A0A",border:"1px solid #FBBF2440",borderRadius:12,padding:"12px 16px",marginBottom:24,maxWidth:340}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#FBBF24",margin:0,textAlign:"center"}}>{mode==="survival"?"⚠️ Survival mode — strongly recommend waiting.":needWant==="want"?"⚠️ This is a want. A timer helps you decide with a clear head.":"⚠️ $"+parseFloat(amount).toLocaleString()+" is a big purchase. Give yourself time."}</p></div>)}
      <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:300,marginBottom:20}}>
        {[24,48,72].map(h=>(<button key={h} onClick={()=>{setWaitHours(h);onWait({item,amount:parseFloat(amount),needWant,waitHours:h});setResult("waiting");}} style={{padding:"16px 20px",background:h===suggestedWait?"#1A1A2E":"#0F172A",border:h===suggestedWait?"2px solid #6366F1":"2px solid #1E293B",borderRadius:14,cursor:"pointer",width:"100%",textAlign:"center"}}>
          <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:17,fontWeight:600,color:h===suggestedWait?"#6366F1":"#E2E8F0"}}>{h} hours</span>
          {h===suggestedWait&&<span style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#6366F1",display:"block",marginTop:4}}>recommended</span>}
        </button>))}
      </div>
      <div style={{width:"100%",maxWidth:300,borderTop:"1px solid #1E293B",paddingTop:16,display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={()=>{onBuyNow({item,amount:parseFloat(amount),needWant,decision:"skip"});setResult("nevermind");}} style={{width:"100%",padding:"14px",background:"#0A2E1A",border:"1px solid #4ADE8030",borderRadius:12,color:"#4ADE80",fontFamily:"'DM Sans', sans-serif",fontSize:14,fontWeight:500,cursor:"pointer"}}>Actually, I don't need it — save ${amount?parseFloat(amount).toLocaleString():0}</button>
        <button onClick={()=>{onBuyNow({item,amount:parseFloat(amount),needWant,decision:"buy"});setResult("bought");}} style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid #334155",borderRadius:12,color:"#94A3B8",fontFamily:"'DM Sans', sans-serif",fontSize:14,cursor:"pointer"}}>Skip timer — buy it now</button>
      </div>
      <button onClick={()=>{setStep(1);setNeedWant(null);}} style={{...backBtnStyle,marginTop:16}}>← Back</button>
    </div>);
  }
}

// ============ QUICK LOG ============

function QuickLog({ onBack, onLog }) {
  const [item,setItem]=useState("");
  const [amount,setAmount]=useState("");
  const [step,setStep]=useState(0);
  const [done,setDone]=useState(null);

  if (done) {
    const skipped = done === "skip";
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <span style={{fontSize:48,marginBottom:16}}>{skipped?"🛡️":"👍"}</span>
        <h2 style={{fontFamily:"'Fraunces', serif",fontSize:24,fontWeight:500,color:skipped?"#4ADE80":"#FBBF24",textAlign:"center",marginBottom:12}}>
          {skipped?"Logged — $"+parseFloat(amount).toLocaleString()+" saved":"Logged — purchased"}
        </h2>
        <button onClick={onBack} style={primaryBtn}>Back to dashboard →</button>
      </div>
    );
  }

  if (step===1) {
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <h2 style={screenTitle}>What did you do?</h2>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#64748B",marginBottom:28,textAlign:"center"}}>{item} — ${parseFloat(amount).toLocaleString()}</p>
        <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:300}}>
          <button onClick={()=>{onLog({type:"spend",item,amount:parseFloat(amount),needWant:"quick log",decision:"skip"});setDone("skip");}} style={gateBtn("#0A2E1A","#4ADE80")}>I skipped it</button>
          <button onClick={()=>{onLog({type:"spend",item,amount:parseFloat(amount),needWant:"quick log",decision:"buy"});setDone("buy");}} style={gateBtn("#1E293B","#94A3B8")}>I bought it</button>
        </div>
        <button onClick={()=>setStep(0)} style={{...backBtnStyle,marginTop:32}}>← Back</button>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <span style={{fontSize:36,marginBottom:16}}>⚡</span>
      <h2 style={screenTitle}>Quick log</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",textAlign:"center",maxWidth:300,marginBottom:24}}>Log something you already decided on. No timer, no steps — just record it.</p>
      <input type="text" value={item} onChange={e=>setItem(e.target.value)} placeholder="What was it?" style={inputStyle} autoFocus/>
      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="How much? ($)" style={{...inputStyle,marginTop:12}}/>
      <button onClick={()=>{if(item&&amount)setStep(1);}} disabled={!item||!amount} style={{...primaryBtn,marginTop:24,opacity:item&&amount?1:0.4}}>Next →</button>
      <button onClick={onBack} style={{...backBtnStyle,marginTop:16}}>← Cancel</button>
    </div>
  );
}

// ============ TRANSITIONS ============

function TransitionPicker({ onBack }) {
  const [selected,setSelected]=useState(null);
  const [checked,setChecked]=useState({});
  if (selected) {
    const steps=TRANSITIONS[selected];
    const allDone=steps.every((_,i)=>checked[i]);
    return (<div style={{minHeight:"100vh",padding:"32px 20px",maxWidth:480,margin:"0 auto"}}>
      <h2 style={{...screenTitle,textAlign:"left",marginBottom:8}}>{selected}</h2>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",marginBottom:28}}>Take 2 minutes. Go through each step.</p>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {steps.map((s,i)=>(<button key={i} onClick={()=>setChecked({...checked,[i]:!checked[i]})} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:checked[i]?"#0A2E1A":"#0F172A",border:checked[i]?"2px solid #4ADE8040":"2px solid #1E293B",borderRadius:14,cursor:"pointer",transition:"all 0.2s ease",width:"100%",textAlign:"left"}}>
          <div style={{width:26,height:26,borderRadius:8,border:checked[i]?"2px solid #4ADE80":"2px solid #334155",background:checked[i]?"#4ADE8020":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{checked[i]&&<span style={{color:"#4ADE80",fontSize:14}}>✓</span>}</div>
          <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:checked[i]?"#4ADE80":"#E2E8F0",textDecoration:checked[i]?"line-through":"none",opacity:checked[i]?0.7:1}}>{s}</span>
        </button>))}
      </div>
      {allDone&&(<div style={{background:"#0A2E1A",border:"2px solid #4ADE8030",borderRadius:16,padding:"20px",marginTop:24,textAlign:"center"}}><span style={{fontSize:32}}>🎯</span><p style={{fontFamily:"'Fraunces', serif",fontSize:20,color:"#4ADE80",margin:"8px 0 0"}}>Transition complete</p></div>)}
      {allDone?(<div style={{display:"flex",flexDirection:"column",gap:12,marginTop:24}}>
        <button onClick={onBack} style={primaryBtn}>Done — back to dashboard →</button>
        <button onClick={()=>{setSelected(null);setChecked({});}} style={backBtnStyle}>← Pick a different transition</button>
      </div>):(<button onClick={()=>{setSelected(null);setChecked({});}} style={{...backBtnStyle,marginTop:24}}>← Back to transitions</button>)}
    </div>);
  }
  return (<div style={{minHeight:"100vh",padding:"32px 20px",maxWidth:480,margin:"0 auto"}}>
    <h2 style={{...screenTitle,textAlign:"left",marginBottom:8}}>Change Gears</h2>
    <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",marginBottom:28}}>Pick the shift you're making right now.</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {Object.keys(TRANSITIONS).map(key=>(<button key={key} onClick={()=>setSelected(key)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",background:"#0F172A",border:"2px solid #1E293B",borderRadius:16,cursor:"pointer",width:"100%",textAlign:"left"}}>
        <span style={{fontFamily:"'DM Sans', sans-serif",fontSize:16,color:"#E2E8F0",fontWeight:500}}>{key}</span>
        <span style={{color:"#334155",fontSize:18}}>›</span>
      </button>))}
    </div>
    <button onClick={onBack} style={{...backBtnStyle,marginTop:28}}>← Back to dashboard</button>
  </div>);
}

// ============ DECISION LOG ============

function DecisionLog({ spendLog, onBack }) {
  const spendEntries=spendLog.filter(e=>e.type!=="decision");
  const saved=spendEntries.filter(e=>e.decision==="skip");
  const bought=spendEntries.filter(e=>e.decision==="buy");
  const totalSaved=saved.reduce((s,e)=>s+(e.amount||0),0);
  const totalSpent=bought.reduce((s,e)=>s+(e.amount||0),0);
  return (<div style={{minHeight:"100vh",padding:"32px 20px",maxWidth:480,margin:"0 auto"}}>
    <h2 style={{...screenTitle,textAlign:"left",marginBottom:8}}>Decision Log</h2>
    <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#64748B",marginBottom:24}}>Your decisions over time. The more you log, the clearer your patterns become.</p>
    {spendEntries.length>0&&(<>
      <div style={{display:"flex",gap:12,marginBottom:24}}>
        <div style={{flex:1,background:"#0A2E1A",border:"1px solid #4ADE8030",borderRadius:14,padding:"16px",textAlign:"center"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#4ADE80",margin:"0 0 4px",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Saved</p><p style={{fontFamily:"'Fraunces', serif",fontSize:24,color:"#4ADE80",margin:0}}>${totalSaved.toLocaleString()}</p></div>
        <div style={{flex:1,background:"#2E0A0A",border:"1px solid #F8717130",borderRadius:14,padding:"16px",textAlign:"center"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#F87171",margin:"0 0 4px",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Spent</p><p style={{fontFamily:"'Fraunces', serif",fontSize:24,color:"#F87171",margin:0}}>${totalSpent.toLocaleString()}</p></div>
      </div>
      <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:"16px 20px",marginBottom:24,textAlign:"center"}}>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:"#64748B",margin:"0 0 4px"}}>Wait rate</p>
        <p style={{fontFamily:"'Fraunces', serif",fontSize:28,color:"#6366F1",margin:0}}>{spendEntries.length>0?Math.round((saved.length/spendEntries.length)*100):0}%</p>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#64748B",margin:"4px 0 0"}}>{saved.length} of {spendEntries.length} purchases paused</p>
      </div>
    </>)}
    {spendLog.length===0?(<p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#475569",textAlign:"center",marginTop:40}}>No entries yet. Use the tools and your decisions will show up here.</p>):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[...spendLog].reverse().map((entry,i)=>{
          if(entry.type==="decision"){
            return (<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",background:"#0F172A",border:"1px solid #1E293B",borderRadius:12}}>
              <div style={{flex:1}}>
                <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#E2E8F0",margin:0,fontWeight:500}}>{entry.item.length>50?entry.item.substring(0,50)+"...":entry.item}</p>
                <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#64748B",margin:"2px 0 0"}}>decision · {entry.date}</p>
              </div>
              <div style={{textAlign:"right"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:entry.decision==="go"?"#4ADE80":"#6366F1",margin:0,fontWeight:600,textTransform:"uppercase"}}>{entry.decision==="go"?"decided":"delayed"}</p></div>
            </div>);
          }
          return (<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",background:"#0F172A",border:"1px solid #1E293B",borderRadius:12}}>
            <div><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:"#E2E8F0",margin:0,fontWeight:500}}>{entry.item}</p><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:12,color:"#64748B",margin:"2px 0 0"}}>{entry.needWant} · {entry.date}{entry.waitHours?" · waited "+entry.waitHours+"h":""}</p></div>
            <div style={{textAlign:"right"}}><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:entry.decision==="skip"?"#4ADE80":"#F87171",margin:0,fontWeight:600}}>${(entry.amount||0).toLocaleString()}</p><p style={{fontFamily:"'DM Sans', sans-serif",fontSize:11,color:entry.decision==="skip"?"#4ADE80":"#F87171",margin:"2px 0 0",textTransform:"uppercase",letterSpacing:0.5}}>{entry.decision==="skip"?"saved":"bought"}</p></div>
          </div>);
        })}
      </div>
    )}
    <button onClick={onBack} style={{...backBtnStyle,marginTop:28}}>← Back to dashboard</button>
  </div>);
}

// ============ STYLES ============

const screenTitle={fontFamily:"'Fraunces', serif",fontSize:26,fontWeight:500,color:"#F1F5F9",textAlign:"center",marginBottom:28,lineHeight:1.3,maxWidth:360};
const inputStyle={width:"100%",maxWidth:320,padding:"16px 20px",background:"#0F172A",border:"2px solid #1E293B",borderRadius:14,color:"#F1F5F9",fontSize:16,fontFamily:"'DM Sans', sans-serif",outline:"none"};
const primaryBtn={padding:"16px 32px",background:"#6366F1",border:"none",borderRadius:14,color:"#fff",fontSize:16,fontFamily:"'DM Sans', sans-serif",fontWeight:600,cursor:"pointer",width:"100%",maxWidth:320};
const backBtnStyle={padding:"12px 20px",background:"transparent",border:"1px solid #1E293B",borderRadius:12,color:"#64748B",fontSize:14,fontFamily:"'DM Sans', sans-serif",cursor:"pointer"};
const gateBtn=(bg,color)=>({padding:"18px 24px",background:bg,border:"2px solid "+color+"30",borderRadius:16,color:color,fontSize:16,fontFamily:"'DM Sans', sans-serif",fontWeight:500,cursor:"pointer",width:"100%",textAlign:"center",transition:"all 0.2s ease"});
const confettiContainer={position:"fixed",top:0,left:0,right:0,height:"100vh",pointerEvents:"none",zIndex:100};
const confettiPiece={position:"absolute",top:"-20px",fontSize:32,animation:"confettiFall 1.5s ease-out forwards"};

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

  // ---- Auth check on mount ----
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

  // ---- Load data when session exists ----
  useEffect(() => {
    if (!session) { setDataLoaded(false); return; }
    loadUserData(session.user.id);
  }, [session]);

  // ---- Refresh pending timers every minute ----
  useEffect(() => {
    const interval = setInterval(() => { setPendingItems(prev => [...prev]); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ---- Timer alert screen logic ----
  const readyItems = pendingItems.filter(item => Date.now() >= item.expiry);
  const waitingItems = pendingItems.filter(item => Date.now() < item.expiry);
  useEffect(() => {
    if (screen === "timer-alert" && readyItems.length > 0 && !currentTimerAlert) {
      setCurrentTimerAlert(readyItems[0]);
    }
  }, [screen, readyItems, currentTimerAlert]);

  // ---- Load all user data from Supabase ----
  const loadUserData = async (userId) => {
    try {
      const { data: checkins } = await supabase
        .from("checkins").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false }).limit(30);

      const { data: spendRows } = await supabase
        .from("spend_entries").select("*").eq("user_id", userId)
        .order("created_at", { ascending: true });

      const { data: decisionRows } = await supabase
        .from("decision_entries").select("*").eq("user_id", userId)
        .order("created_at", { ascending: true });

      const { data: timerRows } = await supabase
        .from("pending_timers").select("*").eq("user_id", userId);

      // Build combined log (same format existing components expect)
      const spendMapped = (spendRows || []).map(r => ({
        type: "spend", item: r.item, amount: Number(r.amount),
        needWant: r.need_want, decision: r.decision,
        waitHours: r.wait_hours, date: new Date(r.created_at).toLocaleDateString(),
      }));
      const decisionMapped = (decisionRows || []).map(r => ({
        type: "decision", item: r.decision_text, decision: r.result,
        date: new Date(r.created_at).toLocaleDateString(),
      }));
      setSpendLog([...spendMapped, ...decisionMapped].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ));

      // Map pending timers
      setPendingItems((timerRows || []).map(r => ({
        id: r.id, item: r.item, amount: Number(r.amount),
        needWant: r.need_want, waitHours: r.wait_hours,
        expiry: new Date(r.expires_at).getTime(),
        date: new Date(r.created_at).toLocaleDateString(),
      })));

      // Decide starting screen
      const allCheckins = checkins || [];
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

  const handleAuth = (s) => { setSession(s); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setScreen(null); setMode(null);
    setSpendLog([]); setPendingItems([]);
    setDataLoaded(false);
  };

  // ---- Check-in complete ----
  const handleCheckinComplete = async (m, answers, total) => {
    setMode(m);
    setScreen("dashboard");
    if (session) {
      try {
        await supabase.from("checkins").insert({
          user_id: session.user.id, sleep: answers.sleep,
          energy: answers.energy, stress: answers.stress,
          emotion: answers.impulse, total_score: total, mode: m,
        });
      } catch (err) { console.error("Failed to save check-in:", err); }
    }
  };

  // ---- Spend Check: set timer ----
  const handleWait = async (entry) => {
    const expiresAt = new Date(Date.now() + entry.waitHours * 60 * 60 * 1000).toISOString();
    const tempId = Date.now().toString();
    setPendingItems(prev => [...prev, {
      id: tempId, item: entry.item, amount: entry.amount,
      needWant: entry.needWant, waitHours: entry.waitHours,
      expiry: Date.now() + entry.waitHours * 60 * 60 * 1000,
      date: new Date().toLocaleDateString(),
    }]);
    if (session) {
      try {
        const { data } = await supabase.from("pending_timers").insert({
          user_id: session.user.id, item: entry.item, amount: entry.amount,
          need_want: entry.needWant, wait_hours: entry.waitHours,
          expires_at: expiresAt, mode_at_time: mode,
        }).select().single();
        if (data) {
          setPendingItems(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
        }
      } catch (err) { console.error("Failed to save timer:", err); }
    }
  };

  // ---- Spend Check: buy now / nevermind ----
  const handleBuyNow = async (entry) => {
    setSpendLog(prev => [...prev, { type: "spend", item: entry.item, amount: entry.amount, needWant: entry.needWant, decision: entry.decision, date: new Date().toLocaleDateString() }]);
    if (session) {
      try {
        await supabase.from("spend_entries").insert({
          user_id: session.user.id, item: entry.item, amount: entry.amount,
          need_want: entry.needWant, decision: entry.decision,
          source: "spend_check", mode_at_time: mode,
        });
      } catch (err) { console.error("Failed to save spend entry:", err); }
    }
  };

  // ---- Decision Gate log or Quick Log ----
  const handleLogEntry = async (entry) => {
    if (entry.type === "decision") {
      setSpendLog(prev => [...prev, { type: "decision", item: entry.item, decision: entry.decision, date: new Date().toLocaleDateString() }]);
      if (session) {
        try {
          await supabase.from("decision_entries").insert({
            user_id: session.user.id, decision_text: entry.item,
            result: entry.decision, flags: entry.flags || 0, mode_at_time: mode,
          });
        } catch (err) { console.error("Failed to save decision:", err); }
      }
    } else {
      setSpendLog(prev => [...prev, { type: "spend", item: entry.item, amount: entry.amount, needWant: entry.needWant, decision: entry.decision, date: new Date().toLocaleDateString() }]);
      if (session) {
        try {
          await supabase.from("spend_entries").insert({
            user_id: session.user.id, item: entry.item, amount: entry.amount,
            need_want: entry.needWant, decision: entry.decision,
            source: "quick_log", mode_at_time: mode,
          });
        } catch (err) { console.error("Failed to save quick log:", err); }
      }
    }
  };

  // ---- Timer resolve ----
  const handleTimerResolve = async (id, decision) => {
    const item = pendingItems.find(i => i.id === id);
    if (item) {
      setSpendLog(prev => [...prev, { type: "spend", item: item.item, amount: item.amount, needWant: item.needWant, decision, date: new Date().toLocaleDateString(), waitHours: item.waitHours }]);
      setPendingItems(prev => prev.filter(i => i.id !== id));
      if (session) {
        try {
          await supabase.from("spend_entries").insert({
            user_id: session.user.id, item: item.item, amount: item.amount,
            need_want: item.needWant, decision, wait_hours: item.waitHours,
            source: "timer", mode_at_time: mode,
          });
          await supabase.from("pending_timers").delete().eq("id", id);
        } catch (err) { console.error("Failed to resolve timer:", err); }
      }
    }
    setCurrentTimerAlert(null);
    setScreen("dashboard");
  };

  // ---- Timer snooze ----
  const handleSnooze = async (id) => {
    const newExpiry = Date.now() + 24 * 60 * 60 * 1000;
    const currentItem = pendingItems.find(i => i.id === id);
    const newWaitHours = (currentItem?.waitHours || 0) + 24;
    setPendingItems(prev => prev.map(i =>
      i.id === id ? { ...i, expiry: newExpiry, waitHours: newWaitHours } : i
    ));
    if (session) {
      try {
        await supabase.from("pending_timers").update({
          expires_at: new Date(newExpiry).toISOString(),
          wait_hours: newWaitHours,
        }).eq("id", id);
      } catch (err) { console.error("Failed to snooze timer:", err); }
    }
    setCurrentTimerAlert(null);
    setScreen("dashboard");
  };

  // ---- RENDER ----
  return (
    <div style={{background:"#020617",minHeight:"100vh",color:"#F1F5F9"}}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>

      {!authChecked && <LoadingScreen />}
      {authChecked && !session && <AuthScreen onAuth={handleAuth} />}
      {authChecked && session && !dataLoaded && <LoadingScreen />}

      {authChecked && session && dataLoaded && (<>
        {screen==="splash"&&<SplashScreen onContinue={()=>setScreen("checkin")}/>}
        {screen==="checkin"&&<CapacityCheckin onComplete={handleCheckinComplete}/>}
        {screen==="dashboard"&&<Dashboard mode={mode} setScreen={setScreen} spendLog={spendLog} pendingItems={waitingItems} readyItems={readyItems} onLogout={handleLogout}/>}
        {screen==="decision"&&<DecisionGate mode={mode} onBack={()=>setScreen("dashboard")} onLog={handleLogEntry}/>}
        {screen==="spend"&&<SpendCheck mode={mode} onBack={()=>setScreen("dashboard")} onWait={handleWait} onBuyNow={handleBuyNow}/>}
        {screen==="quicklog"&&<QuickLog onBack={()=>setScreen("dashboard")} onLog={handleLogEntry}/>}
        {screen==="transition"&&<TransitionPicker onBack={()=>setScreen("dashboard")}/>}
        {screen==="history"&&<DecisionLog spendLog={spendLog} onBack={()=>setScreen("dashboard")}/>}
        {screen==="timer-alert"&&currentTimerAlert&&<TimerAlert item={currentTimerAlert} onResolve={handleTimerResolve} onSnooze={handleSnooze}/>}
      </>)}
    </div>
  );
}
