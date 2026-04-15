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
    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 space-y-5 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-primary text-[10px] font-black uppercase tracking-widest">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Timer className="h-3.5 w-3.5" />
          </div>
          <span>Timer de Descanso</span>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearTimer}
              className="h-8 px-3 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-bold uppercase"
            >
              Limpar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => Notification.requestPermission()}
            className={`h-8 w-8 rounded-xl transition-all duration-300 ${Notification.permission === 'granted' ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted/20'}`}
            title={Notification.permission === 'granted' ? 'Notificações Ativas' : 'Ativar Notificações'}
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {timeLeft === 0 ? (
          <motion.div 
            key="presets"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-4 gap-3">
              {[30, 45, 60, 90].map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => startTimer(s)}
                  className="border-primary/20 bg-card hover:bg-primary hover:text-primary-foreground text-xs font-bold h-10 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
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
            className="space-y-5"
          >
            <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold text-primary tracking-tighter tabular-nums drop-shadow-sm">
                {formatTime(timeLeft)}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleTimer}
                  className="h-11 w-11 rounded-2xl border-primary/20 bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-sm transition-all duration-300"
                >
                  {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetTimer}
                  className="h-11 w-11 rounded-2xl border-primary/20 bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-sm transition-all duration-300"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
