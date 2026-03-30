import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  TimerReset,
  Trophy,
  Coffee,
  Brush,
  Rocket,
} from 'lucide-react';
import './App.css';

const INITIAL_TIME = 40;
const MUSIC_INTERVAL_MS = 4300;
const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

const TimerApp = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [phase, setPhase] = useState('preparation');
  const [confetti, setConfetti] = useState([]);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const audioContextRef = useRef(null);
  const timerStateRef = useRef({ phase: 'preparation', currentIteration: 1 });

  useEffect(() => {
    timerStateRef.current = { phase, currentIteration };
  }, [phase, currentIteration]);

  const phaseMeta = useMemo(() => {
    const map = {
      preparation: {
        label: 'Preparación',
        icon: Sparkles,
        accent: '#60a5fa',
        bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        message: 'Alístate. Respira y prepárate para arrancar fuerte.',
      },
      work: {
        label: 'Fase Cepillado',
        icon: Brush,
        accent: '#6366f1',
        bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        message: 'Dale con ritmo. Ocho segundos full enfoque.',
      },
      break: {
        label: 'Descanso',
        icon: Coffee,
        accent: '#14b8a6',
        bg: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
        message: 'Baja revoluciones y vuelve más fino.',
      },
      finalWork: {
        label: 'Trabajo - Fase Final',
        icon: Rocket,
        accent: '#f97316',
        bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
        message: 'Último empuje. Ya casi coronas esto.',
      },
      completed: {
        label: '¡Sesión Completada!',
        icon: Trophy,
        accent: '#22c55e',
        bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        message: 'Sesión cerrada. Quedó criminalmente bien.',
      },
    };

    return map[phase] ?? map.preparation;
  }, [phase]);

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
  };

  const playBeep = () => {
    initAudio();
    if (!audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  };

  const playCompletionSound = () => {
    initAudio();
    if (!audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const notes = [
        { freq: 523, time: 0, duration: 0.15 },
        { freq: 659, time: 0.15, duration: 0.15 },
        { freq: 784, time: 0.3, duration: 0.15 },
        { freq: 1047, time: 0.45, duration: 0.4 },
      ];

      notes.forEach((note) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = note.freq;
        oscillator.type = 'square';
        const startTime = ctx.currentTime + note.time;
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
      });
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  };

  const playBackgroundMusic = () => {
    if (isMusicMuted) return;

    initAudio();
    if (!audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const melody = [
        523, 659, 784, 1047, 784, 659,
        523, 659, 784, 1047, 784, 659,
        587, 740, 880, 1175, 880, 740,
        523, 659, 784, 1047, 784, 659,
      ];
      const noteDuration = 0.18;

      melody.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'square';
        const startTime = ctx.currentTime + index * noteDuration;
        gainNode.gain.setValueAtTime(0.06, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration - 0.01);
        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
      });
    } catch (error) {
      console.error('Error al reproducir música:', error);
    }
  };

  const createConfetti = () => {
    const newConfetti = [];
    for (let i = 0; i < 100; i += 1) {
      newConfetti.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 2 + Math.random() * 3,
        delay: Math.random() * 0.5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      });
    }
    setConfetti(newConfetti);
  };

  useEffect(() => {
    if (!isRunning || phase === 'completed') return undefined;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        const { phase: currentPhase, currentIteration: iteration } = timerStateRef.current;

        if (currentPhase === 'preparation') {
          playBeep();
          setPhase('work');
          setCurrentIteration(1);
          return 8;
        }

        if (currentPhase === 'work' && iteration < 18) {
          playBeep();
          setCurrentIteration((old) => old + 1);
          return 8;
        }

        if (currentPhase === 'work' && iteration === 18) {
          playBeep();
          setPhase('break');
          setCurrentIteration(1);
          return 40;
        }

        if (currentPhase === 'break') {
          playBeep();
          setPhase('finalWork');
          setCurrentIteration(1);
          return 8;
        }

        if (currentPhase === 'finalWork' && iteration < 3) {
          playBeep();
          setCurrentIteration((old) => old + 1);
          return 8;
        }

        if (currentPhase === 'finalWork' && iteration === 3) {
          playCompletionSound();
          setPhase('completed');
          setIsRunning(false);
          createConfetti();
          return 0;
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, phase]);

  useEffect(() => {
    let musicInterval = null;

    if (isRunning && phase !== 'completed') {
      playBackgroundMusic();
      musicInterval = setInterval(() => {
        playBackgroundMusic();
      }, MUSIC_INTERVAL_MS);
    }

    return () => {
      if (musicInterval) clearInterval(musicInterval);
    };
  }, [isRunning, phase, isMusicMuted]);

  const handleStartPause = () => {
    initAudio();
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(INITIAL_TIME);
    setCurrentIteration(1);
    setPhase('preparation');
    setConfetti([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalIterations = () => {
    if (phase === 'preparation') return 1;
    if (phase === 'work') return 18;
    if (phase === 'break') return 1;
    if (phase === 'finalWork') return 3;
    return 1;
  };

  const getProgress = () => {
    if (phase === 'completed') return 100;
    const total = getTotalIterations();
    return (currentIteration / total) * 100;
  };

  const PhaseIcon = phaseMeta.icon;

  if (phase === 'completed') {
    return (
      <div className="screen complete-screen premium-screen">
        <div className="floating-orb orb-green" />
        <div className="floating-orb orb-yellow" />
        {confetti.map((conf) => (
          <div
            key={conf.id}
            className="confetti-dot"
            style={{
              left: `${conf.left}%`,
              top: '-10px',
              backgroundColor: conf.color,
              animationDuration: `${conf.animationDuration}s`,
              animationDelay: `${conf.delay}s`,
            }}
          />
        ))}

        <div className="card success-card premium-card glass-card">
          <div className="sparkle-wrap trophy-wrap">
            <div className="icon-halo success-halo">
              <Trophy className="sparkle-icon trophy-icon" />
            </div>
          </div>

          <div className="pill success-pill">Sesión cerrada</div>
          <h1>¡Felicidades! 🎉</h1>
          <p>{phaseMeta.message}</p>

          <div className="success-stats">
            <div>
              <span>Rutina</span>
              <strong>Completa</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>Ganaste</strong>
            </div>
          </div>

          <button onClick={handleReset} className="btn btn-success premium-btn success-btn">
            <TimerReset size={20} />
            Nueva Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen app-screen premium-screen">
      <div className="floating-orb orb-blue" />
      <div className="floating-orb orb-purple" />
      <div className="floating-orb orb-cyan" />

      <div className="card app-card-simple premium-card glass-card">
        <div className="card-glow" style={{ background: phaseMeta.bg }} />

        <div className="header-block">
          <div>
            <div className="pill brand-pill">Timer Focus UI</div>
            <h1>Temporizador Automático</h1>
            <p className="subheadline">Animado, limpio y con más flow visual.</p>
          </div>

          <button
            onClick={() => setIsMusicMuted((prev) => !prev)}
            className="icon-toggle premium-icon-toggle"
            title={isMusicMuted ? 'Activar música de fondo' : 'Silenciar música de fondo'}
            aria-label={isMusicMuted ? 'Activar música de fondo' : 'Silenciar música de fondo'}
            aria-pressed={isMusicMuted}
          >
            {isMusicMuted ? (
              <VolumeX size={22} className="mute-icon" />
            ) : (
              <Volume2 size={22} className="sound-icon" />
            )}
          </button>
        </div>

        <div className="hero-panel">
          <div className="phase-chip" style={{ color: phaseMeta.accent, borderColor: `${phaseMeta.accent}55` }}>
            <PhaseIcon size={16} />
            {phaseMeta.label}
          </div>

          <div className={`timer-orb ${isRunning ? 'running' : ''}`}>
            <div className="timer-orb-ring" style={{ background: `conic-gradient(${phaseMeta.accent} ${getProgress()}%, rgba(255,255,255,0.16) 0)` }}>
              <div className="timer-orb-core">
                <div className="timer-text">{formatTime(timeLeft)}</div>
                <div className="timer-subtext">segundos</div>
              </div>
            </div>
          </div>

          <p className="phase-message">{phaseMeta.message}</p>
        </div>

        <div className="status-grid">
          <div className="status-card premium-status">
            <span>Fase</span>
            <strong>{phaseMeta.label}</strong>
          </div>
          <div className="status-card premium-status">
            <span>Iteración</span>
            <strong>
              {phase === 'preparation' || phase === 'break'
                ? 'Única'
                : `${currentIteration} / ${getTotalIterations()}`}
            </strong>
          </div>
          <div className="status-card premium-status">
            <span>Estado</span>
            <strong>{isRunning ? 'Corriendo' : 'Pausado'}</strong>
          </div>
        </div>

        <div className="phase-section">
          <div className="phase-meta-row">
            <span className="phase-meta">
              {phase === 'preparation' || phase === 'break'
                ? 'Fase única'
                : `Iteración ${currentIteration} de ${getTotalIterations()}`}
            </span>
            <span className="phase-percent">{Math.round(getProgress())}%</span>
          </div>

          <div className="progress-bar-bg premium-progress">
            <div className="progress-bar-fill" style={{ width: `${getProgress()}%`, background: phaseMeta.accent }} />
          </div>
        </div>

        <div className="button-row premium-buttons">
          <button onClick={handleStartPause} className="btn btn-primary premium-btn" style={{ background: phaseMeta.accent }}>
            {isRunning ? (
              <>
                <Pause size={20} />
                Pausar
              </>
            ) : (
              <>
                <Play size={20} />
                Iniciar
              </>
            )}
          </button>

          <button onClick={handleReset} className="btn btn-secondary premium-btn secondary-btn">
            <RotateCcw size={20} />
            Reiniciar
          </button>
        </div>

        <div className="sequence-box premium-sequence">
          <h3>Secuencia:</h3>
          <ol>
            <li>Preparación de 40 segundos</li>
            <li>18 intervalos de 8 segundos (cepillado)</li>
            <li>1 descanso de 40 segundos</li>
            <li>3 intervalos de 8 segundos</li>
            <li>¡Celebración al completar!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TimerApp;
