import React, { useEffect, useMemo, useRef, useState } from "react";

/*
 Self‑Advocacy Quest — single‑file React game (keyboard: arrows/WASD to move, Enter/Space to interact)
 Purpose: Give students (including autistic learners) a low‑stakes, game‑like way to PRACTICE
 recognizing signs that self‑advocacy might help and choosing an appropriate strategy.
*/

const DEFAULT_SCENARIOS = [
  {
    id: "noise-cafeteria",
    cue: "It feels too loud and my body is getting tense.",
    context: "School cafeteria during lunch.",
    prompt: "The room is noisy. You're starting to cover your ears.",
    choices: [
      { id: "ask-break", label: "Ask an adult for a quiet break.", isCorrect: true, why: "Taking a brief break reduces overload and is an appropriate self‑advocacy step." },
      { id: "yell", label: "Yell at others to be quiet.", isCorrect: false, why: "Yelling may escalate the situation and doesn't meet your need safely." },
      { id: "ignore", label: "Ignore it and stay uncomfortable.", isCorrect: false, why: "Ignoring signs of distress can make overload worse." },
      { id: "tool", label: "Use headphones or ear defenders and move to a calmer seat.", isCorrect: true, why: "Tools + seating change can lower the noise and help you stay in control." }
    ]
  },
  {
    id: "unclear-instruction",
    cue: "I don't understand the directions and feel stuck.",
    context: "Math class independent work.",
    prompt: "The worksheet says 'Show your work.' You're not sure what that looks like.",
    choices: [
      { id: "ask-clarify", label: "Raise hand and ask for clarification or an example.", isCorrect: true, why: "Asking for clarity is a direct self‑advocacy strategy that helps you proceed." },
      { id: "copy-peer", label: "Copy a peer's paper without understanding.", isCorrect: false, why: "This doesn't help you learn and may cause other problems." },
      { id: "leave", label: "Leave the room without telling anyone.", isCorrect: false, why: "Leaving unsafely isn't advocacy and could worry adults." },
      { id: "visual", label: "Request a visual model or checklist.", isCorrect: true, why: "Visual supports can make expectations clear and reduce stress." }
    ]
  },
  {
    id: "need-break-signal",
    cue: "My heart is racing and I can't focus.",
    context: "Group project with time pressure.",
    prompt: "Your group is talking fast. You feel overwhelmed.",
    choices: [
      { id: "i-statement", label: "Use an 'I' statement: 'I need a 2‑minute break to reset.'", isCorrect: true, why: "Polite, specific statements teach others how to support you." },
      { id: "argue", label: "Tell them they're being annoying.", isCorrect: false, why: "Name‑calling isn't advocacy and may harm relationships." },
      { id: "masking", label: "Stay silent and push through.", isCorrect: false, why: "Noticing signs + taking action is healthier than masking distress." },
      { id: "timer", label: "Ask to use a timer/visual to pace the task.", isCorrect: true, why: "Tools that structure time can lower stress and improve focus." }
    ]
  }
];

const MAP_W = 18;
const MAP_H = 12;
const BASE_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1],
  [1,0,0,1,0,1,0,1,0,1,0,0,1,0,1,1,0,1],
  [1,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const DEFAULT_NPCS = [
  { id: "guide", name: "Guide", x: 2, y: 2, sprite: "🤝", scenarioId: "unclear-instruction" },
  { id: "ally", name: "Ally", x: 9, y: 4, sprite: "🎧", scenarioId: "noise-cafeteria" },
  { id: "teammate", name: "Teammate", x: 14, y: 8, sprite: "⏱️", scenarioId: "need-break-signal" }
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const key = (x, y) => `${x},${y}`;

function useEventListener(type, handler) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  });
  useEffect(() => {
    const fn = (e) => saved.current(e);
    window.addEventListener(type, fn);
    return () => window.removeEventListener(type, fn);
  }, [type]);
}

export default function App() {
  const [map] = useState(BASE_MAP);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [comfort, setComfort] = useState(7);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("Use arrows/WASD to move. Press Space/Enter to interact.");
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [npcs, setNpcs] = useState(DEFAULT_NPCS);
  const [activeScenario, setActiveScenario] = useState(null);
  const [choiceFeedback, setChoiceFeedback] = useState(null);
  const [showTeacher, setShowTeacher] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [bigText, setBigText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const tileSize = 40;

  const walls = useMemo(() => {
    const s = new Set();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (map[y][x] === 1) s.add(key(x, y));
      }
    }
    return s;
  }, [map]);

  function canMove(x, y) {
    return x >= 0 && x < MAP_W && y >= 0 && y < MAP_H && !walls.has(key(x, y));
  }

  useEventListener("keydown", (e) => {
    if (activeScenario) {
      if (e.key === "Escape") setActiveScenario(null);
      return;
    }
    let dx = 0, dy = 0;
    if (["ArrowLeft", "a", "A"].includes(e.key)) dx = -1;
    if (["ArrowRight", "d", "D"].includes(e.key)) dx = 1;
    if (["ArrowUp", "w", "W"].includes(e.key)) dy = -1;
    if (["ArrowDown", "s", "S"].includes(e.key)) dy = 1;

    const next = { x: clamp(player.x + dx, 0, MAP_W - 1), y: clamp(player.y + dy, 0, MAP_H - 1) };
    if (dx !== 0 || dy !== 0) {
      if (canMove(next.x, next.y)) setPlayer(next);
      e.preventDefault();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      const npc = npcs.find((n) => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1);
      if (npc) {
        const sc = scenarios.find((s) => s.id === npc.scenarioId) || null;
        setActiveScenario(sc);
        setChoiceFeedback(null);
        setMessage(`Talking with ${npc.name}…`);
      } else {
        setMessage("There's no one nearby to interact with.");
      }
      e.preventDefault();
    }
  });

  function handleChoice(choice) {
    const deltaComfort = choice.isCorrect ? +2 : -1;
    const deltaScore = choice.isCorrect ? +100 : +0;
    setComfort((c) => clamp(c + deltaComfort, 0, 10));
    setScore((s) => s + deltaScore);
    setChoiceFeedback({ correct: !!choice.isCorrect, why: choice.why });
    if (!choice.isCorrect) setMessage("Nice try — read the feedback and try another option.");
    else setMessage("Great advocacy! Keep going.");
  }

  const cameraStyle = reducedMotion
    ? { transform: "none" }
    : { transform: `translate(${-(player.x * tileSize - 320)}px, ${-(player.y * tileSize - 200)}px)`, transition: "transform 250ms" };

  function exportProgress() {
    const data = { player, comfort, score, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "self-advocacy-quest-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProgress(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (data.player) setPlayer(data.player);
        if (typeof data.comfort === "number") setComfort(clamp(data.comfort, 0, 10));
        if (typeof data.score === "number") setScore(data.score);
        setMessage("Progress loaded.");
      } catch (err) {
        setMessage("Couldn't read file.");
      }
    };
    reader.readAsText(f);
  }

  const [scenarioText, setScenarioText] = useState(() => JSON.stringify({ scenarios: DEFAULT_SCENARIOS, npcs: DEFAULT_NPCS }, null, 2));
  function applyScenarios() {
    try {
      const parsed = JSON.parse(scenarioText);
      if (Array.isArray(parsed.scenarios)) setScenarios(parsed.scenarios);
      if (Array.isArray(parsed.npcs)) setNpcs(parsed.npcs);
      setMessage("Scenarios applied.");
    } catch (e) {
      setMessage("Invalid JSON. No changes made.");
    }
  }

  const rootCls = `min-h-screen ${highContrast ? "bg-black text-white" : "bg-slate-100 text-slate-800"}`;
  const cardCls = `rounded-2xl shadow-lg ${highContrast ? "bg-zinc-900" : "bg-white"} p-4`;
  const hudPill = `px-3 py-1 rounded-full text-sm font-semibold ${highContrast ? "bg-white text-black" : "bg-slate-200 text-slate-800"}`;

  return (
    <div className={rootCls}>
      {/* Toolbar */}
      <div className="max-w-5xl mx-auto p-4 flex flex-wrap items-center gap-2">
        <h1 className={`font-bold ${bigText ? "text-3xl" : "text-2xl"}`}>Self‑Advocacy Quest</h1>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn" onClick={() => setReducedMotion((v) => !v)} aria-pressed={reducedMotion}>
            {reducedMotion ? "Motion: Off" : "Motion: On"}
          </button>
          <button className="btn" onClick={() => setBigText((v) => !v)} aria-pressed={bigText}>
            {bigText ? "Text: Large" : "Text: Normal"}
          </button>
          <button className="btn" onClick={() => setHighContrast((v) => !v)} aria-pressed={highContrast}>
            {highContrast ? "Contrast: High" : "Contrast: Standard"}
          </button>
          <button className="btn" onClick={exportProgress}>Export Progress</button>
          <label className="btn cursor-pointer">
            Import Progress
            <input type="file" className="sr-only" accept="application/json" onChange={importProgress} />
          </label>
          <button className="btn" onClick={() => setShowTeacher((v) => !v)} aria-expanded={showTeacher}>Teacher Panel</button>
        </div>
      </div>

      {/* HUD */}
      <div className="max-w-5xl mx-auto px-4">
        <div className={`grid grid-cols-3 gap-3 ${bigText ? "text-lg" : "text-base"}`}>
          <div className={cardCls}>
            <div className="flex items-center gap-2">
              <span className={hudPill} title="Comfort (0–10)">Comfort: {comfort}/10</span>
              <span className={hudPill} title="Score">Score: {score}</span>
            </div>
            <p className="mt-2 opacity-80">{message}</p>
            <p className="mt-1 text-sm opacity-70">Goal: Notice signs, choose a helpful strategy.</p>
          </div>
          <div className={`${cardCls} col-span-2`}>
            <b>Controls:</b> Move with ←↑→↓ or WASD. Interact with Space/Enter. Close dialogs with Esc.
          </div>
        </div>
      </div>

      {/* Game View */}
      <div className="max-w-5xl mx-auto p-4">
        <div className={`${cardCls} overflow-hidden`} style={{ height: 420 }}>
          <div className="relative w-[2000px] h-[2000px]" style={cameraStyle}>
            {/* Tiles */}
            {map.map((row, y) => row.map((t, x) => (
              <div key={key(x, y)}
                   className={`absolute ${t === 1 ? (highContrast ? "bg-white" : "bg-slate-700") : (highContrast ? "bg-black" : "bg-slate-200")} border ${highContrast ? "border-zinc-700" : "border-slate-300"}`}
                   style={{ left: x * tileSize, top: y * tileSize, width: tileSize, height: tileSize }}
                   aria-hidden />
            )))}
            {/* NPCs */}
            {npcs.map((n) => (
              <div key={n.id}
                   className="absolute flex items-center justify-center text-xl"
                   style={{ left: n.x * tileSize, top: n.y * tileSize, width: tileSize, height: tileSize }}
                   role="img" aria-label={`NPC ${n.name}`}>
                <div className="w-9 h-9 rounded-md flex items-center justify-center bg-amber-300 border border-amber-500">
                  <span>{n.sprite || "🙂"}</span>
                </div>
              </div>
            ))}
            {/* Player */}
            <div className="absolute" style={{ left: player.x * tileSize, top: player.y * tileSize, width: tileSize, height: tileSize }} aria-label="Player">
              <div className="w-9 h-9 rounded-md bg-sky-400 border border-sky-600 flex items-center justify-center text-xl select-none">
                🧑
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Modal */}
      {activeScenario && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className={`${cardCls} max-w-2xl w-full ${bigText ? "text-lg" : "text-base"}`} role="dialog" aria-modal>
            <div className="flex items-start gap-3">
              <div className="text-3xl">💬</div>
              <div className="flex-1">
                <h2 className="font-semibold text-xl">What do you notice?</h2>
                <p className="mt-1 opacity-80"><b>Cue:</b> {activeScenario.cue}</p>
                <p className="opacity-80"><b>Context:</b> {activeScenario.context}</p>
                <p className="mt-2">{activeScenario.prompt}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {activeScenario.choices.map((c) => (
                <button key={c.id}
                        className={`text-left px-3 py-2 rounded-lg border ${highContrast ? "border-white" : "border-slate-300"} hover:bg-emerald-100 focus:outline-none focus:ring`}
                        onClick={() => handleChoice(c)}>
                  {c.label}
                </button>
              ))}
            </div>

            {choiceFeedback && (
              <div className={`mt-4 p-3 rounded-lg ${choiceFeedback.correct ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"}`}>
                <b>{choiceFeedback.correct ? "Nice!" : "Think again:"}</b> {choiceFeedback.why}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setActiveScenario(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Panel */}
      {showTeacher && (
        <div className="max-w-5xl mx-auto p-4">
          <div className={cardCls}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Teacher Panel</h3>
              <span className="ml-auto text-sm opacity-70">Tip: keep labels concrete and use plain language.</span>
            </div>
            <p className="mt-2 text-sm opacity-80">Edit the JSON below to customize scenarios and NPC locations. Each NPC needs a <code>scenarioId</code> that matches a scenario <code>id</code>.</p>
            <textarea value={scenarioText} onChange={(e) => setScenarioText(e.target.value)}
                      className={`mt-3 w-full h-64 p-3 font-mono text-sm rounded-lg border ${highContrast ? "bg-black text-white border-white" : "bg-white border-slate-300"}`}
                      spellCheck={false}
                      aria-label="Scenario JSON editor" />
            <div className="mt-3 flex gap-2">
              <button className="btn" onClick={applyScenarios}>Apply</button>
              <button className="btn" onClick={() => setScenarioText(JSON.stringify({ scenarios, npcs }, null, 2))}>Reset to Current</button>
              <button className="btn" onClick={() => setScenarioText(JSON.stringify({ scenarios: DEFAULT_SCENARIOS, npcs: DEFAULT_NPCS }, null, 2))}>Reset to Defaults</button>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer">JSON shape</summary>
              <pre className={`mt-2 p-3 rounded ${highContrast ? "bg-black border border-white" : "bg-slate-100"}`}>

{`{ "scenarios": [ { "id": "string", "cue": "string", "context": "string", "prompt": "string", "choices": [ { "id": "string", "label": "string", "isCorrect": true, "why": "string" } ] } ], "npcs": [ { "id": "string", "name": "string", "x": 2, "y": 3, "sprite": "🙂", "scenarioId": "id" } ] }`}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl mx-auto p-4 pb-10">
        <div className="text-center opacity-70 text-sm">© {new Date().getFullYear()} Self‑Advocacy Quest — for educational practice (not a medical tool).</div>
      </div>
    </div>
  );
}