import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import './App.css';

const TimerApp = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [phase, setPhase] = useState('preparation');
  const [confetti, setConfetti] = useState([]);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const audioContextRef = useRef(null);

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
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][Math.floor(Math.random() * 6)],
      });
    }
    setConfetti(newConfetti);
  };

  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (phase === 'preparation') {
        playBeep();
        setPhase('work');
        setCurrentIteration(1);
        setTimeLeft(8);
      } else if (phase === 'work' && currentIteration < 18) {
        playBeep();
        setCurrentIteration((prev) => prev + 1);
        setTimeLeft(8);
      } else if (phase === 'work' && currentIteration === 18) {
        playBeep();
        setPhase('break');
        setCurrentIteration(1);
        setTimeLeft(40);
      } else if (phase === 'break') {
        playBeep();
        setPhase('finalWork');
        setCurrentIteration(1);
        setTimeLeft(8);
      } else if (phase === 'finalWork' && currentIteration < 3) {
        playBeep();
        setCurrentIteration((prev) => prev + 1);
        setTimeLeft(8);
      } else if (phase === 'finalWork' && currentIteration === 3) {
        playCompletionSound();
        setPhase('completed');
        setIsRunning(false);
        createConfetti();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, phase, currentIteration]);

  useEffect(() => {
    let musicInterval = null;

    if (isRunning && phase !== 'completed') {
      playBackgroundMusic();
      musicInterval = setInterval(() => {
        playBackgroundMusic();
      }, 4300);
    }

    return () => {
      if (musicInterval) clearInterval(musicInterval);
    };
  }, [isRunning, phase, isMusicMuted]);

  const handleStartPause = () => {
    initAudio();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(40);
    setCurrentIteration(1);
    setPhase('preparation');
    setConfetti([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    if (phase === 'preparation') return 'Preparación';
    if (phase === 'work') return 'Fase Cepillado';
    if (phase === 'break') return 'Descanso';
    if (phase === 'finalWork') return 'Trabajo - Fase Final';
    return '¡Sesión Completada!';
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

  if (phase === 'completed') {
    return (
      <div className="screen complete-screen">
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

        <div className="card success-card">
          <div className="sparkle-wrap">
            <Sparkles className="sparkle-icon" />
          </div>

          <h1>¡Felicidades! 🎉</h1>
          <p>Has completado la sesión de cepillado</p>

          <button onClick={handleReset} className="btn btn-success">
            <RotateCcw size={20} />
            Nueva Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen app-screen">
      <div className="card app-card-simple">
        <h1>Temporizador Automático</h1>

        <div className="top-actions">
          <button
            onClick={() => setIsMusicMuted(!isMusicMuted)}
            className="icon-toggle"
            title={isMusicMuted ? 'Activar música de fondo' : 'Silenciar música de fondo'}
          >
            {isMusicMuted ? (
              <VolumeX size={24} className="mute-icon" />
            ) : (
              <Volume2 size={24} className="sound-icon" />
            )}
          </button>
        </div>

        <div className="phase-section">
          <div className="phase-title">{getPhaseText()}</div>
          <div className="phase-meta">
            {phase === 'preparation' || phase === 'break'
              ? 'Fase única'
              : `Iteración ${currentIteration} de ${getTotalIterations()}`}
          </div>

          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${getProgress()}%` }} />
          </div>
        </div>

        <div className="timer-section">
          <div className="timer-text">{formatTime(timeLeft)}</div>
          <div className="timer-subtext">segundos</div>
        </div>

        <div className="button-row">
          <button onClick={handleStartPause} className="btn btn-primary">
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

          <button onClick={handleReset} className="btn btn-secondary">
            <RotateCcw size={20} />
            Reiniciar
          </button>
        </div>

        <div className="sequence-box">
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
