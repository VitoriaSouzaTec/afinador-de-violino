"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ViolinString {
  name: string;
  label: string;
  freq: number;
  hint: string;
}

interface NoteInfo {
  name: string;
  label: string;
  cents: number;
  targetFreq: number;
}

const STRINGS: ViolinString[] = [
  { name: "G", label: "Sol", freq: 196.0, hint: "corda grave" },
  { name: "D", label: "Ré", freq: 293.66, hint: "segunda corda" },
  { name: "A", label: "Lá", freq: 440.0, hint: "referência" },
  { name: "E", label: "Mi", freq: 659.25, hint: "corda aguda" },
];

const NOTE_NAMES: { name: string; label: string }[] = [
  { name: "C", label: "Dó" },
  { name: "C#", label: "Dó#" },
  { name: "D", label: "Ré" },
  { name: "D#", label: "Ré#" },
  { name: "E", label: "Mi" },
  { name: "F", label: "Fá" },
  { name: "F#", label: "Fá#" },
  { name: "G", label: "Sol" },
  { name: "G#", label: "Sol#" },
  { name: "A", label: "Lá" },
  { name: "A#", label: "Lá#" },
  { name: "B", label: "Si" },
];

function freqToNote(freq: number): NoteInfo | null {
  if (!freq || freq < 50) return null;
  const semitones = 12 * Math.log2(freq / 440);
  const noteIndex = Math.round(semitones) + 9;
  const note = NOTE_NAMES[((noteIndex % 12) + 12) % 12];
  const targetFreq = 440 * Math.pow(2, Math.round(semitones) / 12);
  const cents = Math.round(1200 * Math.log2(freq / targetFreq));
  return { name: note.name, label: note.label, cents, targetFreq };
}

function centsFromTarget(freq: number, targetFreq: number): number {
  return Math.round(1200 * Math.log2(freq / targetFreq));
}

function autoCorrelate(buffer: Float32Array<ArrayBuffer>, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buffer[i]) < thres) { r1 = i; break; } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; } }

  const buf2 = buffer.slice(r1, r2);
  const c: number[] = new Array(buf2.length).fill(0);
  for (let i = 0; i < buf2.length; i++)
    for (let j = 0; j < buf2.length - i; j++) c[i] += buf2[j] * buf2[j + i];

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < buf2.length; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }

  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

export default function ViolinTuner() {
  const [listening, setListening] = useState<boolean>(false);
  const [freq, setFreq] = useState<number | null>(null);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [selectedString, setSelectedString] = useState<ViolinString>(STRINGS[0]);

  const animRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const smoothedFreqRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef(0);
  const lastSignalRef = useRef(0);

  const detect = useCallback(function detectFrame() {
    if (!analyserRef.current || !bufferRef.current || !audioCtxRef.current) return;
    analyserRef.current.getFloatTimeDomainData(bufferRef.current);

    let sum = 0;
    for (let i = 0; i < bufferRef.current.length; i++) sum += bufferRef.current[i] ** 2;
    setVolume(Math.min(1, Math.sqrt(sum / bufferRef.current.length) * 10));

    const now = performance.now();
    const f = autoCorrelate(bufferRef.current, audioCtxRef.current.sampleRate);
    if (f > 0) {
      lastSignalRef.current = now;
      if (now - lastUiUpdateRef.current >= 220) {
        const previous = smoothedFreqRef.current ?? f;
        const smoothed = previous + (f - previous) * 0.35;

        smoothedFreqRef.current = smoothed;
        setFreq(Math.round(smoothed * 10) / 10);
        setNote(freqToNote(smoothed));
        lastUiUpdateRef.current = now;
      }
    } else if (now - lastSignalRef.current > 800) {
      smoothedFreqRef.current = null;
      setFreq(null);
      setNote(null);
    }
    animRef.current = requestAnimationFrame(detectFrame);
  }, []);

  const start = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      audioCtxRef.current = ctx;
      streamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
      smoothedFreqRef.current = null;
      lastUiUpdateRef.current = 0;
      lastSignalRef.current = performance.now();
      setListening(true);
      animRef.current = requestAnimationFrame(detect);
    } catch {
      alert("Permissão de microfone necessária.");
    }
  };

  const stop = useCallback((): void => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (audioCtxRef.current) void audioCtxRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    smoothedFreqRef.current = null;
    setListening(false);
    setFreq(null);
    setNote(null);
    setVolume(0);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const selectString = (string: ViolinString): void => {
    setSelectedString(string);
    setFreq(null);
    setNote(null);
    smoothedFreqRef.current = null;
    lastUiUpdateRef.current = 0;
    lastSignalRef.current = 0;
  };

  const cents = freq ? centsFromTarget(freq, selectedString.freq) : 0;
  const inTune = freq !== null && Math.abs(cents) <= 5;
  const tuneColor = !freq ? "#4a3728" : inTune ? "#b9f6ca" : "#ffcdd2";
  const tuneBorder = !freq ? "#2a1f18" : inTune ? "#43a047" : "#d32f2f";
  const tuneLabel = !freq ? "—" : inTune ? "AFINADO" : cents > 0 ? `+${cents}¢ ALTO` : `${cents}¢ BAIXO`;
  const guidance = !freq
    ? `Toque a corda ${selectedString.label}`
    : inTune
      ? "Verde: nota afinada no alvo"
      : cents > 0
        ? "Vermelho: está alto, afrouxe um pouco"
        : "Vermelho: está baixo, aperte um pouco";
  const needleX = 50 + Math.max(-47, Math.min(47, (cents / 50) * 47));

return (
  <div style={{
    minHeight: "100vh",
    background: "linear-gradient(rgba(10,7,4,0.80), rgba(10,7,4,0.88)), url('/violino.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    fontFamily: "'Georgia', 'Palatino Linotype', serif",
  }}>

      <div style={{
        width: "min(420px, 92vw)",
        height: "6px",
        background: "linear-gradient(90deg, #2a1a0e 0%, #6b3d1e 20%, #8b5a2b 35%, #5c3318 50%, #7a4a22 65%, #4a2810 80%, #2a1a0e 100%)",
        borderRadius: "3px 3px 0 0",
      }} />

      {/* Main card */}
      <div style={{
        width: "min(420px, 92vw)",
        background: "linear-gradient(170deg, #1a1209 0%, #120e08 40%, #0e0b07 100%)",
        border: "1px solid #3d2510",
        borderTop: "none",
        borderRadius: "0 0 20px 20px",
        padding: "36px 32px 32px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Subtle wood texture lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            position: "absolute",
            left: 0, right: 0,
            top: `${20 + i * 22}%`,
            height: "1px",
            background: `rgba(${90 + i * 8},${50 + i * 5},${20 + i * 3},0.12)`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{ textAlign: "center", marginBottom: "32px", position: "relative" }}>
          <p style={{ margin: 0, fontSize: "10px", letterSpacing: "8px", color: "#6b3d1e", textTransform: "uppercase", marginBottom: "6px" }}>
            Afinador
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(28px,7vw,42px)", fontWeight: 400, color: "#f5ede0", letterSpacing: "6px", textTransform: "uppercase" }}>
            Violino
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "10px" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #6b3d1e)" }} />
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#8b5a2b" }} />
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #6b3d1e, transparent)" }} />
          </div>
        </div>

        <div style={{
          textAlign: "center",
          marginBottom: "28px",
          padding: "24px 16px 20px",
          background: freq ? (inTune ? "#07160a" : "#1a0707") : "#0a0704",
          borderRadius: "12px",
          border: `1px solid ${freq ? tuneBorder : "#2a1a0e"}`,
          transition: "background 0.2s, border-color 0.2s",
        }}>
          <div style={{
            fontSize: "clamp(54px,16vw,88px)",
            fontWeight: 300,
            lineHeight: 1,
            color: freq ? tuneColor : "#3d2510",
            letterSpacing: "-3px",
            transition: "color 0.15s",
          }}>
            {selectedString.label}
          </div>
          <div style={{ marginTop: "10px", fontSize: "13px", color: freq ? "#f5ede0" : "#4a3020", letterSpacing: "1px" }}>
            {freq ? `${freq} Hz agora` : "aguardando sinal"}
          </div>
          <div style={{ marginTop: "6px", fontSize: "10px", color: "#8b5a2b", letterSpacing: "2px", textTransform: "uppercase" }}>
            alvo {selectedString.freq.toFixed(2)} Hz · detectado {note ? `${note.label} (${note.name})` : "—"}
          </div>
          <div style={{
            marginTop: "12px",
            fontSize: "11px",
            color: freq ? tuneBorder : "#4a3020",
            letterSpacing: "1px",
            transition: "color 0.2s",
          }}>
            {guidance}
          </div>
        </div>

        {/* Cents meter */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ position: "relative", height: "32px" }}>
            <div style={{
              position: "absolute",
              top: "50%", left: 0, right: 0,
              height: "6px",
              marginTop: "-3px",
              background: "#0a0704",
              borderRadius: "3px",
              border: "1px solid #2a1a0e",
            }}>
              <div style={{
                position: "absolute",
                left: "46%", width: "8%", top: 0, bottom: 0,
                background: "#1a2e1a",
                borderRadius: "2px",
              }} />
            </div>
            <div style={{
              position: "absolute",
              left: "50%", top: "4px", bottom: "4px",
              width: "1px",
              background: "#5c3318",
              transform: "translateX(-50%)",
            }} />
            {freq && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: `${needleX}%`,
                transform: "translate(-50%, -50%)",
                width: "16px", height: "16px",
                borderRadius: "50%",
                background: tuneColor,
                border: `2px solid ${tuneBorder}`,
                transition: "left 0.08s ease, background 0.2s, border-color 0.2s",
                boxShadow: inTune ? `0 0 12px ${tuneBorder}66` : "none",
              }} />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", color: "#3d2510", letterSpacing: "1px" }}>♭ BAIXO</span>
            <span style={{
              fontSize: "11px", letterSpacing: "3px",
              color: freq ? tuneBorder : "#2a1a0e",
              fontFamily: "monospace",
              transition: "color 0.2s",
            }}>
              {tuneLabel}
            </span>
            <span style={{ fontSize: "10px", color: "#3d2510", letterSpacing: "1px" }}>ALTO ♯</span>
          </div>
        </div>

        {/* Volume meter */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#3d2510", marginBottom: "7px", textTransform: "uppercase" }}>
            Volume
          </div>
          <div style={{
            height: "5px",
            background: "#0a0704",
            borderRadius: "3px",
            border: "1px solid #1a1209",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${volume * 100}%`,
              background: "linear-gradient(90deg, #4a2810, #8b5a2b, #c8904a)",
              borderRadius: "3px",
              transition: "width 0.05s",
            }} />
          </div>
        </div>

        {/* String indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "28px" }}>
          {STRINGS.map((s) => {
            const isSelected = selectedString.name === s.name;
            const selectedBackground = freq ? (inTune ? "#08200e" : "#260b0b") : "#1a0f08";
            return (
              <button key={s.name} type="button" onClick={() => selectString(s)} style={{
                textAlign: "center",
                padding: "14px 8px",
                background: isSelected ? selectedBackground : "#0a0704",
                border: `1px solid ${isSelected ? tuneBorder : "#1a1209"}`,
                borderRadius: "10px",
                transition: "all 0.2s",
                boxShadow: isSelected && freq ? `0 0 16px ${tuneBorder}33` : "none",
                cursor: "pointer",
                fontFamily: "'Georgia', serif",
              }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: 300,
                  color: isSelected ? "#f5ede0" : "#3d2510",
                  lineHeight: 1,
                  transition: "color 0.2s",
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "10px", color: isSelected ? "#8b5a2b" : "#2a1a0e", marginTop: "4px", letterSpacing: "1px" }}>
                  {s.name} · {s.freq.toFixed(2)} Hz
                </div>
                <div style={{ fontSize: "8px", color: isSelected ? "#6b3d1e" : "#24160c", marginTop: "3px", letterSpacing: "1px", textTransform: "uppercase" }}>
                  {s.hint}
                </div>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={listening ? stop : start}
          style={{
            width: "100%",
            padding: "16px",
            background: listening
              ? "linear-gradient(135deg, #1a0808, #2e1010)"
              : "linear-gradient(135deg, #1e1008, #2e1a08)",
            border: `1px solid ${listening ? "#7a2020" : "#8b5a2b"}`,
            borderRadius: "10px",
            color: listening ? "#e57373" : "#f5ede0",
            fontSize: "11px",
            letterSpacing: "5px",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'Georgia', serif",
            transition: "all 0.2s",
          }}
        >
          {listening ? "⏹  Parar" : `🎙  Afinar ${selectedString.label}`}
        </button>
      </div>

      {/* Bottom wood bar */}
      <div style={{
        width: "min(420px, 92vw)",
        height: "4px",
        marginTop: "2px",
        background: "linear-gradient(90deg, #2a1a0e 0%, #6b3d1e 30%, #8b5a2b 50%, #4a2810 70%, #2a1a0e 100%)",
        borderRadius: "0 0 3px 3px",
        opacity: 0.6,
      }} />

      <p style={{ marginTop: "20px", fontSize: "10px", letterSpacing: "4px", color: "#2a1a0e", textTransform: "uppercase" }}>
        Sol · Ré · Lá · Mi
      </p>
    </div>
  );
}