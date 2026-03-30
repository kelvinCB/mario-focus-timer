import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import './App.css';

const PREPARATION_SECONDS = 40;
const WORK_SECONDS = 40;
const BREAK_SECONDS = 20;
const TOTAL_ITERATIONS = 3;

const PHASES = {
  preparation: 'preparation',
  work: 'work',
  break: 'break',
  finalWork: 'finalWork',
  completed: 'completed',
};

const phaseConfig = {
  [PHASES.preparation]: {
    label: 'Preparación',
    subtitle: 'Respira, enfócate y prepárate para arrancar.',
    duration: PREPARATION_SECONDS,
    color: '#60a5fa',
  },
  [PHASES.work]: {
    label: 'Trabajo',
    subtitle: 'Modo estrella activado. Dale con todo.',
    duration: WORK_SECONDS,
    color: '#f59e0b',
  },
  [PHASES.break]: {
    label: 'Break',
    subtitle: 'Micro descanso. Sacude los hombros y vuelve.',
    duration: BREAK_SECONDS,
    color: '#34d399',
  },
  [PHASES.finalWork]: {
    label: 'Trabajo final',
    subtitle: 'Último empuje. Cierra fuerte.',
    duration: WORK_SECONDS,
    color: '#f97316',
  },
  [PHASES.completed]: {
    label: 'Completado',
    subtitle: 'Misión cumplida. Quedó nítido.',
    duration: 0,
    color: '#a78bfa',
  },
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const TimerApp = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PREPARATION_SECONDS);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [phase, setPhase] = useState(PHASES.preparation);
  const [confetti, setConfetti] = useState([]);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioContextRef = useRef(null);
  const musicTimeoutsRef = useRef([]);

  const currentConfig = phaseConfig[phase];
  const totalSeconds = currentConfig.duration || 1;
  const progress = useMemo(() => (timeLeft / totalSeconds) * 100, [timeLeft, totalSeconds]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (!audioUnlocked) {
      setAudioUnlocked(true);
    }
  };

  const clearScheduledMusic = () => {
    musicTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    musicTimeoutsRef.current = [];
  };

  const playTone = (frequency, startAt = 0, duration = 0.18, type = 'square', volume = 0.08) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    const now = ctx.currentTime + startAt;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  };

  const playBeep = () => {
    initAudio();
    if (!audioContextRef.current) return;
    playTone(880, 0, 0.25, 'sine', 0.15);
  };

  const playCompletionSound = () => {
    initAudio();
    if (!audioContextRef.current) return;

    const notes = [
      { freq: 523, time: 0, duration: 0.15 },
      { freq: 659, time: 0.15, duration: 0.15 },
      { freq: 784, time: 0.3, duration: 0.15 },
      { freq: 1047, time: 0.45, duration: 0.45 },
    ];

    notes.forEach((note) => {
      playTone(note.freq, note.time, note.duration, 'square', 0.12);
    });
  };

  const playBackgroundMusic = () => {
    if (isMusicMuted || !isRunning || phase === PHASES.completed) return;
    initAudio();
    if (!audioContextRef.current) return;

    clearScheduledMusic();

    const melody = [
      523, 659, 784, 1047, 784, 659,
      523, 659, 784, 1047, 784, 659,
      587, 740, 880, 1175, 880, 740,
      523, 659, 784, 1047, 784, 659,
    ];

    const noteDuration = 0.18;
    const loopDurationMs = melody.length * noteDuration * 1000;

    melody.forEach((freq, index) => {
      playTone(freq, index * noteDuration, 0.14, 'square', 0.035);
    });

    const timeoutId = window.setTimeout(() => {
      if (isRunning && !isMusicMuted && phase !== PHASES.completed) {
        playBackgroundMusic();
      }
    }, loopDurationMs);

    musicTimeoutsRef.current.push(timeoutId);
  };

  const spawnConfetti = () => {
    const pieces = Array.from({ length: 120 }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
      color: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'][index % 6],
      size: 6 + Math.random() * 10,
    }));

    setConfetti(pieces);
    window.setTimeout(() => setConfetti([]), 4200);
  };

  const advancePhase = () => {
    playBeep();

    if (phase === PHASES.preparation) {
      setPhase(PHASES.work);
      setTimeLeft(WORK_SECONDS);
      return;
    }

    if (phase === PHASES.work && currentIteration < TOTAL_ITERATIONS) {
      setPhase(PHASES.break);
      setTimeLeft(BREAK_SECONDS);
      return;
    }

    if (phase === PHASES.break) {
      const nextIteration = currentIteration + 1;
      setCurrentIteration(nextIteration);
      if (nextIteration === TOTAL_ITERATIONS) {
        setPhase(PHASES.finalWork);
        setTimeLeft(WORK_SECONDS);
      } else {
        setPhase(PHASES.work);
        setTimeLeft(WORK_SECONDS);
      }
      return;
    }

    if (phase === PHASES.work && currentIteration === TOTAL_ITERATIONS) {
      setPhase(PHASES.completed);
      setTimeLeft(0);
      setIsRunning(false);
      playCompletionSound();
      spawnConfetti();
      clearScheduledMusic();
      return;
    }

    if (phase === PHASES.finalWork) {
      setPhase(PHASES.completed);
      setTimeLeft(0);
      setIsRunning(false);
      playCompletionSound();
      spawnConfetti();
      clearScheduledMusic();
    }
  };

  useEffect(() => {
    if (!isRunning || phase === PHASES.completed) return undefined;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, phase, currentIteration]);

  useEffect(() => {
    if (isRunning && !isMusicMuted && audioUnlocked && phase !== PHASES.completed) {
      playBackgroundMusic();
    } else {
      clearScheduledMusic();
    }

    return () => clearScheduledMusic();
  }, [isRunning, isMusicMuted, phase, audioUnlocked]);

  useEffect(() => () => clearScheduledMusic(), []);

  const toggleRunning = () => {
    initAudio();
    if (phase === PHASES.completed) return;
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    clearScheduledMusic();
    setIsRunning(false);
    setTimeLeft(PREPARATION_SECONDS);
    setCurrentIteration(1);
    setPhase(PHASES.preparation);
    setConfetti([]);
  };

  const toggleMusic = () => {
    initAudio();
    setIsMusicMuted((prev) => !prev);
  };

  return (
    <div className="app-shell">
      <div className="bg-grid" />
      {confetti.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size * 0.55}px`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}

      <main className="app-card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Mario Focus Timer</p>
            <h1>Web app de enfoque con energía de estrella</h1>
            <p className="lead">
              Preparación de 40s, bloques de trabajo de 40s, breaks de 20s y cierre con sonido victorioso.
            </p>
          </div>
          <button className="icon-button ghost" onClick={toggleMusic} aria-label="Alternar música">
            {isMusicMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <section className="timer-panel">
          <div className="phase-badge" style={{ borderColor: currentConfig.color, color: currentConfig.color }}>
            <Sparkles size={16} />
            <span>{currentConfig.label}</span>
          </div>

          <div className="timer-ring" style={{ '--progress': `${progress}%`, '--phase-color': currentConfig.color }}>
            <div className="timer-core">
              <span className="time-label">{formatTime(timeLeft)}</span>
              <span className="phase-subtitle">{currentConfig.subtitle}</span>
            </div>
          </div>

          <div className="status-row">
            <div className="status-card">
              <span className="status-title">Iteración</span>
              <strong>{currentIteration} / {TOTAL_ITERATIONS}</strong>
            </div>
            <div className="status-card">
              <span className="status-title">Estado</span>
              <strong>{phase === PHASES.completed ? 'Terminado' : isRunning ? 'Corriendo' : 'Pausado'}</strong>
            </div>
          </div>

          <div className="controls-row">
            <button className="action-button primary" onClick={toggleRunning} disabled={phase === PHASES.completed}>
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button className="action-button secondary" onClick={resetTimer}>
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Flujo</h2>
            <ul>
              <li>40s de preparación</li>
              <li>3 rondas de trabajo</li>
              <li>20s de descanso entre rondas</li>
              <li>Sonido final + confetti</li>
            </ul>
          </article>

          <article className="info-card">
            <h2>Audio</h2>
            <ul>
              <li>Beep fuerte en cada transición</li>
              <li>Jingle victorioso al final</li>
              <li>Música retro de fondo muteable</li>
              <li>Web Audio API, sin assets externos</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
};

export default TimerApp;
