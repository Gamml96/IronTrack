import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      if (!isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 lg:bottom-8 right-4 left-4 lg:left-auto lg:w-80 z-[100]"
      >
        <div className="bg-card border border-accent/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-main">Instalar IronTrack</h3>
                <p className="text-[10px] text-text-dim">Acesse mais rápido da sua tela inicial</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPrompt(false)}
              className="text-text-dim hover:text-text-main p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button 
            onClick={handleInstall}
            className="w-full bg-accent hover:bg-accent/90 text-background font-bold text-xs uppercase tracking-widest h-10"
          >
            Instalar Agora
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
