import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Timer, Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RestTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [initialTime, setInitialTime] = useState<number>(0);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setInitialTime(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setTimeLeft(initialTime);
    setIsActive(false);
  };

  const clearTimer = () => {
    setTimeLeft(0);
    setIsActive(false);
  };

  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio alert failed:", e);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      
      // Audio alert
      playBeep();

      // Notification feedback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('IRONTRACK: Descanso Finalizado!', {
          body: 'Hora de começar a próxima série!',
          icon: '/favicon.ico'
        });
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, playBeep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  return (
    <div className="bg-background/40 border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-dim text-[10px] font-bold uppercase tracking-widest">
          <Timer className="h-3 w-3" />
          <span>Timer de Descanso</span>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearTimer}
              className="h-6 px-2 text-[10px] text-text-dim hover:text-red-400"
            >
              Limpar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => Notification.requestPermission()}
            className={`h-6 w-6 ${Notification.permission === 'granted' ? 'text-success' : 'text-text-dim'}`}
            title={Notification.permission === 'granted' ? 'Notificações Ativas' : 'Ativar Notificações'}
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {timeLeft === 0 ? (
          <motion.div 
            key="presets"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-2"
          >
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => startTimer(s)}
                  className="border-border bg-card hover:bg-accent-glow hover:text-accent text-xs font-mono h-8"
                >
                  {s}s
                </Button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="relative h-1.5 w-full bg-border rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-accent"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-3xl font-mono font-bold text-accent tracking-tighter">
                {formatTime(timeLeft)}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleTimer}
                  className="h-9 w-9 rounded-full border-border bg-card hover:text-accent"
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetTimer}
                  className="h-9 w-9 rounded-full border-border bg-card hover:text-accent"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
