"use client";

import { useState } from "react";
import ViolinTuner from "./components/violinTurner";
import ViolinInfo from "./components/violinInfo";
import TempoTimer from "./components/temporTime";

type Tab = "tuner" | "info" | "metronome";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "tuner",     label: "Afinador",    sub: "Tuner"      },
  { id: "info",      label: "Enciclopédia", sub: "Violino"   },
  { id: "metronome", label: "Metrônomo",   sub: "Tempo"      },
];

export default function Home() {
  const [active, setActive] = useState<Tab>("tuner");

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Georgia', 'Palatino Linotype', serif" }}>

      {/* ── Top nav bar ── */}
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "rgba(10,7,4,0.96)",
        borderBottom: "1px solid #2a1a0e",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}>
        {/* thin wood stripe at very top */}
        <div style={{
          height: "3px",
          background: "linear-gradient(90deg, #2a1a0e 0%, #6b3d1e 25%, #8b5a2b 50%, #6b3d1e 75%, #2a1a0e 100%)",
        }} />

        <div style={{
          maxWidth: "480px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}>
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                style={{
                  padding: "14px 8px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "#8b5a2b" : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span style={{
                  fontSize: "11px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: isActive ? "#f5ede0" : "#4a3020",
                  transition: "color 0.2s",
                  fontFamily: "'Georgia', serif",
                }}>
                  {tab.label}
                </span>
                <span style={{
                  fontSize: "9px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: isActive ? "#8b5a2b" : "#2a1a0e",
                  transition: "color 0.2s",
                }}>
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Page content — padding-top compensa a nav fixa ── */}
      <div style={{ paddingTop: "64px" }}>
        {active === "tuner"     && <ViolinTuner />}
        {active === "info"      && <ViolinInfo />}
        {active === "metronome" && <TempoTimer />}
      </div>
    </div>
  );
}