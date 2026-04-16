import React, { useState } from 'react';
import { ExerciseTemplate } from './types';
import { AuthWrapper } from './components/AuthWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkoutTemplates } from './components/WorkoutTemplates';
import { History } from './components/History';
import { Progress } from './components/Progress';
import { LogExerciseV2 } from './components/LogExerciseV2';
import { UserTemplatesList } from './components/UserTemplatesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { 
  Dumbbell, 
  History as HistoryIcon, 
  TrendingUp, 
  Settings, 
  LogOut,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { StatsHeader } from './components/StatsHeader';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'logging'>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [editingLog, setEditingLog] = useState<any>(null);

  const handleSignOut = () => signOut(auth);

  const handleEditLog = (log: any) => {
    setEditingLog(log);
    setSelectedExercise({ 
      name: log.exerciseName, 
      sets: log.sets.length, 
      reps: log.sets[0]?.reps || 10 
    });
    setActiveView('logging');
  };

  const handleCompleteLogging = () => {
    setActiveView('dashboard');
    setEditingLog(null);
    setSelectedExercise(null);
  };

  return (
    <ThemeProvider defaultTheme="light">
      <ErrorBoundary>
        <AuthWrapper>
        {(user) => (
          <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground font-sans overflow-hidden">
            <Toaster position="top-center" richColors />
            <PWAInstallPrompt />
            
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
              <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                <div className="p-1.5 bg-primary/10 rounded-xl">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">IronTrack</span>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shadow-sm">
                  {user.displayName?.charAt(0)}
                </div>
              </div>
            </header>

            {/* Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-[280px] border-r border-border p-8 flex-col gap-10 shrink-0 bg-card/30">
              <div className="flex items-center gap-3 text-primary font-bold text-2xl tracking-tight">
                <div className="p-2 bg-primary/10 rounded-2xl shadow-sm">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">IronTrack</span>
              </div>

              <div className="px-1">
                <ThemeToggle />
              </div>

            <nav className="flex flex-col gap-3">
              {[
                { id: 'today', label: 'Meu Dia', icon: LayoutDashboard },
                { id: 'history', label: 'Jornada', icon: HistoryIcon },
                { id: 'progress', label: 'Conquistas', icon: TrendingUp },
                { id: 'settings', label: 'Rotinas', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setActiveView('dashboard');
                    setEditingLog(null);
                  }}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === item.id && activeView === 'dashboard'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4.5 w-4.5 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
                    {item.label}
                  </div>
                  {item.id === 'today' && <div className="w-2 h-2 rounded-full bg-success animate-bounce" />}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-border/50">
              <div className="flex items-center gap-4 mb-6 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user.displayName?.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{user.displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <LogOut className="h-4 w-4" /> Sair da conta
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-12 overflow-y-auto pb-24 lg:pb-12 bg-background/50">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="max-w-6xl mx-auto space-y-10"
                >
                  <header className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
                      <div>
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                          {activeTab === 'today' && 'Olá! Vamos treinar? 🏋️‍♂️'}
                          {activeTab === 'history' && 'Sua Jornada'}
                          {activeTab === 'progress' && 'Suas Conquistas'}
                          {activeTab === 'settings' && 'Minhas Rotinas'}
                        </h1>
                        <p className="text-muted-foreground text-sm lg:text-base mt-2 font-medium">
                          {activeTab === 'today' && 'Escolha um exercício e brilhe hoje!'}
                          {activeTab === 'history' && 'Cada treino é um passo para sua melhor versão.'}
                          {activeTab === 'progress' && 'Veja o quanto você já evoluiu!'}
                          {activeTab === 'settings' && 'Personalize seus treinos com carinho.'}
                        </p>
                      </div>
                    </div>
                    
                    {activeTab === 'today' && <StatsHeader user={user} />}
                  </header>

                  <div className="space-y-12">
                    {activeTab === 'today' && (
                      <div className="grid gap-10 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                          <div className="space-y-5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-6 bg-primary rounded-full" />
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Treinos Favoritos</h3>
                            </div>
                            <UserTemplatesList 
                              user={user} 
                              onSelectExercise={(ex) => {
                                setSelectedExercise(ex);
                                setActiveView('logging');
                              }} 
                            />
                          </div>

                          <div className="space-y-5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-6 bg-secondary rounded-full" />
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Sugestões Rápidas</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {["Supino Reto", "Agachamento", "Levantamento Terra", "Rosca Direta", "Puxada Frente"].map(ex => (
                                <Button 
                                  key={ex} 
                                  variant="outline" 
                                  size="default"
                                  className="rounded-2xl border-primary/20 bg-card hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md"
                                  onClick={() => {
                                    setSelectedExercise({ name: ex, sets: 3, reps: 10 });
                                    setActiveView('logging');
                                  }}
                                >
                                  {ex}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                           <History user={user} onEdit={handleEditLog} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'history' && <History user={user} onEdit={handleEditLog} />}
                    {activeTab === 'progress' && <Progress user={user} />}
                    {activeTab === 'settings' && <WorkoutTemplates user={user} />}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logging"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="max-w-2xl mx-auto"
                >
                  <Button 
                    variant="ghost" 
                    onClick={handleCompleteLogging}
                    className="mb-8 gap-2 text-muted-foreground hover:text-primary -ml-2 lg:ml-0 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" /> Voltar para o início
                  </Button>
                  
                  {selectedExercise && (
                    <LogExerciseV2 
                      key={`${selectedExercise.name}-${editingLog?.id || 'new'}`}
                      user={user} 
                      exerciseName={selectedExercise.name} 
                      initialSets={editingLog ? editingLog.sets : Array.from({ length: selectedExercise.sets || 1 }, () => ({ reps: selectedExercise.reps || 10, weight: 0 }))}
                      onComplete={handleCompleteLogging}
                      logId={editingLog?.id}
                      defaultReps={selectedExercise.reps || 10}
                      defaultWeight={editingLog?.sets[0]?.weight || 0}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-card/90 border border-border/50 px-4 py-3 flex justify-around items-center z-50 backdrop-blur-xl rounded-3xl shadow-2xl">
            {[
              { id: 'today', icon: LayoutDashboard, label: 'Hoje' },
              { id: 'history', icon: HistoryIcon, label: 'Jornada' },
              { id: 'progress', icon: TrendingUp, label: 'Evolução' },
              { id: 'settings', icon: Settings, label: 'Treinos' },
            ].map((item) => {
              const isActive = activeTab === item.id && activeView === 'dashboard';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setActiveView('dashboard');
                    setEditingLog(null);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1.5 py-1 px-4 transition-all duration-300 ${
                    isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </AuthWrapper>
    </ErrorBoundary>
    </ThemeProvider>
  );
}
