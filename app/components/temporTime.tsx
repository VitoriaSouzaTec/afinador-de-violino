"use client";

import { useState, useEffect, useRef } from "react";

interface Tempo {
  label: string;
  name: string;
  min: number;
  max: number;
  default: number;
  desc: string;
}

const TEMPOS: Tempo[] = [
  { label: "Largo",     name: "Muito lento",    min: 40,  max: 60,  default: 50,  desc: "Grande e solene" },
  { label: "Adagio",    name: "Lento e suave",  min: 60,  max: 76,  default: 66,  desc: "Tranquilo, expressivo" },
  { label: "Andante",   name: "Passo a passo",  min: 76,  max: 108, default: 92,  desc: "Ritmo de caminhada" },
  { label: "Moderato",  name: "Moderado",       min: 108, max: 120, default: 112, desc: "Fluido e equilibrado" },
  { label: "Allegro",   name: "Rápido e vivo",  min: 120, max: 156, default: 132, desc: "Animado e enérgico" },
  { label: "Presto",    name: "Muito rápido",   min: 168, max: 200, default: 176, desc: "Veloz e brilhante" },
];

function getTempoForBpm(bpm: number): Tempo {
  return TEMPOS.slice().reverse().find(t => bpm >= t.min) ?? TEMPOS[0];
}

export default function TempoTimer() {
  const [bpm, setBpm] = useState(92);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);          // 0..3 (compasso 4/4)
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [accentFirst, setAccentFirst] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatRef = useRef(0);

  const tempo = getTempoForBpm(bpm);

  function playClick(accent: boolean) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accent ? 1800 : 1200;
    gain.gain.setValueAtTime(accent ? 0.4 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  function startStop() {
    if (playing) {
      clearInterval(intervalRef.current!);
      setPlaying(false);
      setBeat(0);
      beatRef.current = 0;
    } else {
      setPlaying(true);
      beatRef.current = 0;
      setBeat(0);
      const tick = () => {
        const isAccent = accentFirst && beatRef.current === 0;
        playClick(isAccent);
        setBeat(beatRef.current);
        beatRef.current = (beatRef.current + 1) % beatsPerBar;
      };
      tick();
      intervalRef.current = setInterval(tick, (60 / bpm) * 1000);
    }
  }

  // Restart interval when bpm changes while playing
  useEffect(() => {
    if (!playing) return;
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      const isAccent = accentFirst && beatRef.current === 0;
      playClick(isAccent);
      setBeat(beatRef.current);
      beatRef.current = (beatRef.current + 1) % beatsPerBar;
    }, (60 / bpm) * 1000);
    return () => clearInterval(intervalRef.current!);
  }, [bpm, beatsPerBar, accentFirst, playing]);

  useEffect(() => () => { clearInterval(intervalRef.current!); }, []);

  const pendulumAngle = playing ? (beat % 2 === 0 ? -28 : 28) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(rgba(6,4,10,0.88), rgba(6,4,10,0.94)), url('/violino.jpg')",
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 16px", fontFamily: "'Georgia', 'Palatino Linotype', serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ margin: 0, fontSize: "10px", letterSpacing: "8px", color: "#5a3a7a", textTransform: "uppercase", marginBottom: "6px" }}>Metrônomo</p>
        <h1 style={{ margin: 0, fontSize: "clamp(24px,6vw,38px)", fontWeight: 400, color: "#e8e0f0", letterSpacing: "5px", textTransform: "uppercase" }}>Tempo</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "8px" }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #5a3a7a)" }} />
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#7a5a9a" }} />
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #5a3a7a, transparent)" }} />
        </div>
      </div>

      <div style={{ width: "min(420px, 92vw)" }}>
        {/* Pendulum visual */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", height: "120px", alignItems: "flex-start" }}>
          <div style={{ position: "relative", width: "4px", height: "100px", display: "flex", justifyContent: "center" }}>
            <div style={{
              position: "absolute", top: 0, width: "2px", height: "90px",
              background: "linear-gradient(180deg, #5a3a7a, #9a6aba)",
              transformOrigin: "top center",
              transform: `rotate(${pendulumAngle}deg)`,
              transition: playing ? `transform ${(60 / bpm) * 0.5}s ease-in-out` : "transform 0.4s ease",
              borderRadius: "1px",
            }}>
              <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: "20px", height: "20px", borderRadius: "50%", background: playing ? "#9a6aba" : "#3a2a4a", border: "1px solid #7a5a9a", transition: "background 0.2s", boxShadow: playing ? "0 0 12px rgba(154,106,186,0.5)" : "none" }} />
            </div>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7a5a9a", position: "absolute", top: -4, zIndex: 1 }} />
          </div>
        </div>

        {/* BPM display */}
        <div style={{ background: "#0a0710", border: "1px solid #2a1a3a", borderRadius: "12px", padding: "24px 20px", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "clamp(56px,16vw,88px)", fontWeight: 300, color: "#e8e0f0", lineHeight: 1, letterSpacing: "-2px" }}>
            {bpm}
          </div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#5a3a7a", marginTop: "4px" }}>BPM</div>
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontSize: "clamp(16px,4vw,22px)", color: "#9a6aba", letterSpacing: "3px", fontWeight: 400 }}>{tempo.label}</div>
            <div style={{ fontSize: "11px", color: "#5a3a7a", marginTop: "3px", letterSpacing: "1px" }}>{tempo.desc}</div>
          </div>
        </div>

        {/* BPM slider */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="range" min={40} max={208} step={1} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#7a5a9a" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#3a2a4a", letterSpacing: "1px", marginTop: "4px" }}>
            <span>40</span><span>♩ = {bpm}</span><span>208</span>
          </div>
        </div>

        {/* Tempo presets */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
          {TEMPOS.map(t => {
            const active = tempo.label === t.label;
            return (
              <button key={t.label} onClick={() => setBpm(t.default)} style={{
                padding: "10px 6px", background: active ? "#1a0f28" : "#0a0710",
                border: `1px solid ${active ? "#7a5a9a" : "#1a1228"}`,
                borderRadius: "8px", cursor: "pointer", transition: "all 0.15s",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "13px", color: active ? "#e8e0f0" : "#3a2a4a", letterSpacing: "1px", fontFamily: "'Georgia', serif" }}>{t.label}</div>
                <div style={{ fontSize: "9px", color: active ? "#7a5a9a" : "#2a1a3a", marginTop: "2px" }}>{t.min}–{t.max}</div>
              </button>
            );
          })}
        </div>

        {/* Beat dots + compasso */}
        <div style={{ background: "#0a0710", border: "1px solid #1a1228", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "3px", color: "#3a2a4a", textTransform: "uppercase" }}>Compasso</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[2, 3, 4, 6].map(n => (
                <button key={n} onClick={() => { setBeatsPerBar(n); setBeat(0); beatRef.current = 0; }} style={{
                  width: "28px", height: "22px", background: beatsPerBar === n ? "#2a1a3a" : "transparent",
                  border: `1px solid ${beatsPerBar === n ? "#7a5a9a" : "#2a1a3a"}`,
                  borderRadius: "4px", color: beatsPerBar === n ? "#9a6aba" : "#3a2a4a",
                  fontSize: "11px", cursor: "pointer", fontFamily: "'Georgia', serif",
                }}>
                  {n}/4
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {Array.from({ length: beatsPerBar }).map((_, i) => {
              const isCurrentBeat = playing && beat === i;
              const isAccent = i === 0 && accentFirst;
              return (
                <div key={i} style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: isCurrentBeat ? (isAccent ? "#7a5a9a" : "#3a2a4a") : "#0e0a18",
                  border: `1px solid ${isAccent ? "#7a5a9a" : "#2a1a3a"}`,
                  transition: "background 0.05s",
                  boxShadow: isCurrentBeat && isAccent ? "0 0 14px rgba(122,90,154,0.6)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", color: isAccent ? "#9a6aba" : "#3a2a4a",
                }}>
                  {isAccent ? "◆" : "◇"}
                </div>
              );
            })}
          </div>
        </div>

        {/* Accent toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "0 4px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#3a2a4a", textTransform: "uppercase" }}>Acentuar 1º tempo</span>
          <button onClick={() => setAccentFirst(v => !v)} style={{
            width: "44px", height: "24px", borderRadius: "12px",
            background: accentFirst ? "#2a1a3a" : "#0a0710",
            border: `1px solid ${accentFirst ? "#7a5a9a" : "#2a1a3a"}`,
            cursor: "pointer", position: "relative", transition: "all 0.2s",
          }}>
            <div style={{
              width: "16px", height: "16px", borderRadius: "50%",
              background: accentFirst ? "#9a6aba" : "#2a1a3a",
              position: "absolute", top: "3px",
              left: accentFirst ? "24px" : "4px",
              transition: "all 0.2s",
            }} />
          </button>
        </div>

        {/* Play button */}
        <button onClick={startStop} style={{
          width: "100%", padding: "16px",
          background: playing ? "linear-gradient(135deg, #1a0828, #2a1040)" : "linear-gradient(135deg, #120a20, #1e1030)",
          border: `1px solid ${playing ? "#7a2080" : "#5a3a7a"}`,
          borderRadius: "10px", color: playing ? "#c080e0" : "#e8e0f0",
          fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase",
          cursor: "pointer", fontFamily: "'Georgia', serif", transition: "all 0.2s",
        }}>
          {playing ? "⏹  Parar" : "▶  Iniciar Metrônomo"}
        </button>
      </div>
    </div>
  );
}