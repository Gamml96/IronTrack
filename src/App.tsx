import React, { useState } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { WorkoutTemplates } from './components/WorkoutTemplates';
import { History } from './components/History';
import { Progress } from './components/Progress';
import { LogExercise } from './components/LogExercise';
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
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [editingLog, setEditingLog] = useState<any>(null);

  const handleSignOut = () => signOut(auth);

  const handleEditLog = (log: any) => {
    setEditingLog(log);
    setSelectedExercise(log.exerciseName);
    setActiveView('logging');
  };

  const handleCompleteLogging = () => {
    setActiveView('dashboard');
    setEditingLog(null);
    setSelectedExercise(null);
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <AuthWrapper>
        {(user) => (
          <div className="flex flex-col lg:flex-row min-h-screen bg-background text-text-main font-sans overflow-hidden">
            <Toaster position="top-center" richColors theme="dark" />
            <PWAInstallPrompt />
            
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
              <div className="flex items-center gap-2 text-accent font-extrabold text-lg tracking-tight">
                <Dumbbell className="h-5 w-5" />
                <span>IRONTRACK</span>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                  {user.displayName?.charAt(0)}
                </div>
              </div>
            </header>

            {/* Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-[240px] border-r border-border p-6 flex-col gap-8 shrink-0">
              <div className="flex items-center gap-2 text-accent font-extrabold text-xl tracking-tight">
                <Dumbbell className="h-6 w-6" />
                <span>IRONTRACK</span>
              </div>

              <div className="px-2">
                <ThemeToggle />
              </div>

            <nav className="flex flex-col gap-2">
              {[
                { id: 'today', label: 'Hoje', icon: LayoutDashboard },
                { id: 'history', label: 'Histórico', icon: HistoryIcon },
                { id: 'progress', label: 'Progresso', icon: TrendingUp },
                { id: 'settings', label: 'Treinos', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setActiveView('dashboard');
                    setEditingLog(null);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id && activeView === 'dashboard'
                      ? 'bg-accent-glow text-accent'
                      : 'text-text-dim hover:bg-card hover:text-text-main'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.id === 'today' && <div className="w-2 h-2 rounded-full bg-success" />}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                  {user.displayName?.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate">{user.displayName}</p>
                  <p className="text-[10px] text-text-dim truncate">{user.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="w-full justify-start gap-2 text-text-dim hover:text-red-400 hover:bg-red-400/10"
              >
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 lg:space-y-8"
                >
                  <header className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                          {activeTab === 'today' && 'Treino de Hoje'}
                          {activeTab === 'history' && 'Histórico de Treinos'}
                          {activeTab === 'progress' && 'Sua Evolução'}
                          {activeTab === 'settings' && 'Gerenciar Rotinas'}
                        </h1>
                        <p className="text-text-dim text-xs lg:text-sm mt-1">
                          {activeTab === 'today' && 'Selecione um exercício para começar'}
                          {activeTab === 'history' && 'Acompanhe sua jornada'}
                          {activeTab === 'progress' && 'Visualização de dados e performance'}
                          {activeTab === 'settings' && 'Configure seus exercícios e dias'}
                        </p>
                      </div>
                    </div>
                    
                    {activeTab === 'today' && <StatsHeader user={user} />}
                  </header>

                  <div className="space-y-8">
                    {activeTab === 'today' && (
                      <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest">Seus Treinos Salvos</h3>
                            <UserTemplatesList 
                              user={user} 
                              onSelectExercise={(ex) => {
                                setSelectedExercise(ex);
                                setActiveView('logging');
                              }} 
                            />
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest">Exercícios Comuns</h3>
                            <div className="flex flex-wrap gap-2">
                              {["Supino Reto", "Agachamento", "Levantamento Terra", "Rosca Direta", "Puxada Frente"].map(ex => (
                                <Button 
                                  key={ex} 
                                  variant="outline" 
                                  size="sm"
                                  className="border-border bg-card hover:bg-accent-glow hover:text-accent text-xs"
                                  onClick={() => {
                                    setSelectedExercise(ex);
                                    setActiveView('logging');
                                  }}
                                >
                                  {ex}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-2xl mx-auto"
                >
                  <Button 
                    variant="ghost" 
                    onClick={handleCompleteLogging}
                    className="mb-6 gap-2 text-text-dim hover:text-text-main -ml-2 lg:ml-0"
                  >
                    <ChevronLeft className="h-4 w-4" /> Voltar ao Painel
                  </Button>
                  
                  {selectedExercise && (
                    <LogExercise 
                      user={user} 
                      exerciseName={selectedExercise} 
                      onComplete={handleCompleteLogging}
                      initialSets={editingLog?.sets}
                      logId={editingLog?.id}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 border-t border-border px-2 py-2 flex justify-around items-center z-50 backdrop-blur-lg">
            {[
              { id: 'today', icon: LayoutDashboard, label: 'Hoje' },
              { id: 'history', icon: HistoryIcon, label: 'Histórico' },
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
                  className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 min-w-[64px] transition-all ${
                    isActive ? 'text-accent' : 'text-text-dim'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"
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
    </ThemeProvider>
  );
}
