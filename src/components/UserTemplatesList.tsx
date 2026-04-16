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

import { Template, ExerciseTemplate } from '../types';
import { parseSafeDate } from '../lib/dateUtils';

interface Log {
  exerciseName: string;
  date: string;
}

interface UserTemplatesListProps {
  user: User;
  onSelectExercise: (ex: ExerciseTemplate) => void;
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
        return parseSafeDate(a.createdAt || 0).getTime() - parseSafeDate(b.createdAt || 0).getTime();
      }

      if (!a.lastCompletedAt) return -1;
      if (!b.lastCompletedAt) return 1;
      return parseSafeDate(a.lastCompletedAt).getTime() - parseSafeDate(b.lastCompletedAt).getTime();
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
      <Card className="border-border/50 bg-card/50 animate-pulse rounded-3xl">
        <CardContent className="p-8 h-32" />
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed border-primary/20 bg-primary/5 rounded-3xl">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">Você ainda não criou nenhum treino. 🏋️‍♂️</p>
        </CardContent>
      </Card>
    );
  }

  if (!nextWorkout) return null;

  const allExercisesDone = nextWorkout.exercises.every(ex => completedExercises.includes(ex.name));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Próximo na Sequência</h4>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-full">
          {followingWorkout ? followingWorkout.name : nextWorkout.name}
        </span>
      </div>

      <Card className="border-border/40 bg-card shadow-xl overflow-hidden group rounded-3xl">
        <div className="bg-primary/5 px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5">Treino de Hoje</p>
              <p className="text-base font-bold text-foreground leading-none">{nextWorkout.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSkip(nextWorkout.id)}
              className="h-9 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
            >
              <SkipForward className="h-3.5 w-3.5" /> Pular
            </Button>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="grid divide-y divide-border/30">
            {nextWorkout.exercises.map((ex, i) => {
              const isDone = completedExercises.includes(ex.name);
              return (
                <button
                  key={i}
                  onClick={() => onSelectExercise(ex)}
                  className={`flex items-center justify-between p-5 hover:bg-primary/5 transition-all duration-300 group/item w-full text-left ${isDone ? 'bg-success/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-7 w-7 rounded-xl border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone 
                        ? 'bg-success border-success text-primary-foreground scale-110' 
                        : 'border-border text-muted-foreground group-hover/item:border-primary group-hover/item:text-primary group-hover/item:scale-105'
                    }`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold transition-all duration-300 ${
                        isDone ? 'text-muted-foreground line-through opacity-60' : 'text-foreground group-hover/item:text-primary group-hover/item:translate-x-1'
                      }`}>{ex.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {ex.sets} x {ex.reps}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-all duration-300 ${
                    isDone ? 'text-success' : 'text-muted-foreground group-hover/item:text-primary group-hover/item:translate-x-1'
                  }`} />
                </button>
              );
            })}
          </div>
        </CardContent>

        <div className="p-5 bg-muted/20 border-t border-border/50">
          <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
            <DialogTrigger
              render={
                <Button 
                  className={`w-full gap-2 font-bold uppercase tracking-widest text-xs h-12 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                    allExercisesDone 
                      ? 'bg-success hover:bg-success/90 shadow-success/20' 
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                  }`}
                >
                  <Flag className="h-4 w-4" /> Finalizar Treino
                </Button>
              }
            />
            <DialogContent className="bg-card border-border text-foreground rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Finalizar Treino? 🏋️‍♂️</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  {allExercisesDone 
                    ? "Parabéns! Você completou todos os exercícios da rotina com maestria." 
                    : "Você ainda não registrou todos os exercícios deste treino hoje. Deseja finalizar assim mesmo?"}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-3 sm:gap-0 mt-4">
                <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)} className="border-border text-muted-foreground rounded-xl">
                  Continuar Treinando
                </Button>
                <Button onClick={handleFinalize} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/10">
                  Sim, Finalizar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="flex flex-col items-center gap-2 px-4">
        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-70">
          O próximo treino da sequência aparecerá após você finalizar este.
        </p>
        {followingWorkout && (
          <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
            <SkipForward className="h-3 w-3 text-secondary" />
            <p className="text-[10px] text-secondary uppercase tracking-tight font-black">
              Depois deste: {followingWorkout.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
