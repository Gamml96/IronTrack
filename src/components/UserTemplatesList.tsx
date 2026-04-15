import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ChevronRight, Dumbbell, SkipForward, CheckCircle2, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';

interface Template {
  id: string;
  name: string;
  exercises: string[];
  order?: number;
  lastCompletedAt?: string;
  createdAt?: string;
}

interface Log {
  exerciseName: string;
  date: string;
}

interface UserTemplatesListProps {
  user: User;
  onSelectExercise: (ex: string) => void;
}

export const UserTemplatesList: React.FC<UserTemplatesListProps> = ({ user, onSelectExercise }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'templates'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t: Template[] = [];
      snapshot.forEach((doc) => {
        t.push({ id: doc.id, ...doc.data() } as Template);
      });
      setTemplates(t);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/templates`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Fetch today's logs to track progress
  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'users', user.uid, 'logs'),
      where('date', '>=', startOfDay.toISOString())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const done: string[] = [];
      snapshot.forEach((doc) => {
        done.push(doc.data().exerciseName);
      });
      setCompletedExercises(done);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Find the next workouts in sequence
  const getSortedWorkouts = () => {
    if (templates.length === 0) return [];
    
    return [...templates].sort((a, b) => {
      if (a.lastCompletedAt === b.lastCompletedAt) {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }

      if (!a.lastCompletedAt) return -1;
      if (!b.lastCompletedAt) return 1;
      return new Date(a.lastCompletedAt).getTime() - new Date(b.lastCompletedAt).getTime();
    });
  };

  const sortedWorkouts = getSortedWorkouts();
  const nextWorkout = sortedWorkouts[0];
  const followingWorkout = sortedWorkouts.length > 1 ? sortedWorkouts[1] : null;

  const handleFinalize = async () => {
    if (!nextWorkout) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'templates', nextWorkout.id), {
        lastCompletedAt: new Date().toISOString(),
        skipped: false
      });
      toast.success("Treino finalizado com sucesso! Próximo na sequência carregado.");
      setIsFinalizeDialogOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/templates/${nextWorkout.id}`);
    }
  };

  const handleSkip = async (templateId: string) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'templates', templateId), {
        lastCompletedAt: new Date().toISOString(),
        skipped: true
      });
      toast.info("Treino pulado! Ele voltou para o fim da fila.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/templates/${templateId}`);
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card/50 animate-pulse">
        <CardContent className="p-8 h-32" />
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed border-border bg-transparent">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-text-dim">Você ainda não criou nenhum treino.</p>
        </CardContent>
      </Card>
    );
  }

  if (!nextWorkout) return null;

  const allExercisesDone = nextWorkout.exercises.every(ex => completedExercises.includes(ex));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Próximo Treino na Sequência</h4>
        </div>
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
          {followingWorkout ? followingWorkout.name : nextWorkout.name}
        </span>
      </div>

      <Card className="border-border bg-card shadow-xl overflow-hidden group">
        <div className="bg-accent/5 px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-accent font-bold uppercase tracking-wider mb-0.5">Treino de Hoje</p>
              <p className="text-sm font-bold text-text-main leading-none">{nextWorkout.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSkip(nextWorkout.id)}
              className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider text-text-dim hover:text-accent hover:bg-accent/10"
            >
              <SkipForward className="h-3 w-3" /> Pular
            </Button>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="grid divide-y divide-border/50">
            {nextWorkout.exercises.map((ex, i) => {
              const isDone = completedExercises.includes(ex);
              return (
                <button
                  key={i}
                  onClick={() => onSelectExercise(ex)}
                  className={`flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group/item w-full text-left ${isDone ? 'bg-success/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded border flex items-center justify-center text-[10px] font-mono transition-colors ${
                      isDone 
                        ? 'bg-success border-success text-background' 
                        : 'border-border text-text-dim group-hover/item:border-accent group-hover/item:text-accent'
                    }`}>
                      {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      isDone ? 'text-text-dim line-through' : 'text-text-main group-hover/item:text-accent'
                    }`}>{ex}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-colors ${
                    isDone ? 'text-success' : 'text-text-dim group-hover/item:text-accent'
                  }`} />
                </button>
              );
            })}
          </div>
        </CardContent>

        <div className="p-4 bg-background/50 border-t border-border/50">
          <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
            <DialogTrigger
              render={
                <Button 
                  className={`w-full gap-2 font-bold uppercase tracking-widest text-xs h-10 ${
                    allExercisesDone ? 'bg-success hover:bg-success/90' : 'bg-accent hover:bg-accent/90'
                  }`}
                >
                  <Flag className="h-4 w-4" /> Finalizar Treino
                </Button>
              }
            />
            <DialogContent className="bg-card border-border text-text-main">
              <DialogHeader>
                <DialogTitle>Finalizar Treino?</DialogTitle>
                <DialogDescription className="text-text-dim">
                  {allExercisesDone 
                    ? "Parabéns! Você completou todos os exercícios da rotina." 
                    : "Você ainda não registrou todos os exercícios deste treino hoje. Deseja finalizar assim mesmo?"}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)} className="border-border text-text-dim">
                  Continuar Treinando
                </Button>
                <Button onClick={handleFinalize} className="bg-accent hover:bg-accent/90 text-background font-bold">
                  Sim, Finalizar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] text-center text-text-dim uppercase tracking-widest font-medium">
          O próximo treino da sequência só aparecerá após você finalizar este.
        </p>
        {followingWorkout && (
          <p className="text-[9px] text-accent/60 uppercase tracking-tighter font-bold">
            Depois deste: {followingWorkout.name}
          </p>
        )}
      </div>
    </div>
  );
};
