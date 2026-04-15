import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Save, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface Set {
  reps: number;
  weight: number;
}

interface LogExerciseProps {
  user: User;
  exerciseName: string;
  onComplete: () => void;
  initialSets?: Set[];
  logId?: string;
}

import { RestTimer } from './RestTimer';
import { doc, updateDoc } from 'firebase/firestore';

export const LogExercise: React.FC<LogExerciseProps> = ({ 
  user, 
  exerciseName, 
  onComplete,
  initialSets,
  logId
}) => {
  const [sets, setSets] = useState<Set[]>(initialSets || [{ reps: 10, weight: 0 }]);
  const [lastSets, setLastSets] = useState<Set[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingLast, setLoadingLast] = useState(false);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Pre-load last workout data
  useEffect(() => {
    if (!logId && !initialSets) {
      const fetchLastLog = async () => {
        setLoadingLast(true);
        try {
          const q = query(
            collection(db, 'users', user.uid, 'logs'),
            where('exerciseName', '==', exerciseName),
            orderBy('date', 'desc'),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const lastLog = querySnapshot.docs[0].data();
            if (lastLog.sets && lastLog.sets.length > 0) {
              setSets(lastLog.sets.map((s: Set) => ({ ...s })));
              setLastSets(lastLog.sets);
              toast.info(`Dados da última execução de "${exerciseName}" carregados!`);
            }
          }
        } catch (error) {
          // If index is missing, it will fail silently here but log to console
          console.warn("Could not fetch last log (possibly missing index):", error);
        } finally {
          setLoadingLast(false);
        }
      };
      fetchLastLog();
    }
  }, [user.uid, exerciseName, logId, initialSets]);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { ...lastSet }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: keyof Set, value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (logId) {
        await updateDoc(doc(db, 'users', user.uid, 'logs', logId), {
          sets,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Treino atualizado!");
      } else {
        await addDoc(collection(db, 'users', user.uid, 'logs'), {
          exerciseName,
          date: new Date().toISOString(),
          sets,
          createdAt: new Date().toISOString(),
        });

        toast.success("Exercício registrado!");
      }
      onComplete();
    } catch (error) {
      handleFirestoreError(error, logId ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/logs/${logId || ''}`);
    }
    setSaving(false);
  };

  return (
    <Card className="border-border bg-card text-text-main shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl font-bold tracking-tight">
          <span>{logId ? `Editar: ${exerciseName}` : exerciseName}</span>
          {loadingLast && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RestTimer />

        <div className="space-y-4">
          {sets.map((set, i) => (
            <div key={i} className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-3 relative group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <Label className="text-[10px] uppercase tracking-widest text-text-dim font-bold">Série</Label>
                </div>
                
                <div className="flex items-center gap-3">
                  {lastSets && lastSets[i] && (
                    <span className="text-[9px] text-accent/60 font-mono uppercase bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                      Anterior: {lastSets[i].weight}kg x {lastSets[i].reps}
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeSet(i)}
                    className="h-6 w-6 text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Weight Stepper */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] text-text-dim uppercase font-bold ml-1">Peso (kg)</Label>
                  <div className="flex items-center bg-card rounded-lg border border-border p-0.5 shadow-inner h-11">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 shrink-0 text-text-dim hover:text-accent hover:bg-accent/10"
                      onClick={() => updateSet(i, 'weight', Math.max(0, set.weight - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={set.weight}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        if (!isNaN(Number(val)) || val === '') {
                          updateSet(i, 'weight', val === '' ? 0 : Number(val));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 bg-transparent text-center font-mono text-base font-bold focus:outline-none min-w-0 w-full h-full"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 shrink-0 text-text-dim hover:text-accent hover:bg-accent/10"
                      onClick={() => updateSet(i, 'weight', set.weight + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Reps Stepper */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] text-text-dim uppercase font-bold ml-1">Reps</Label>
                  <div className="flex items-center bg-card rounded-lg border border-border p-0.5 shadow-inner h-11">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 shrink-0 text-text-dim hover:text-accent hover:bg-accent/10"
                      onClick={() => updateSet(i, 'reps', Math.max(0, set.reps - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={set.reps}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          updateSet(i, 'reps', val === '' ? 0 : Number(val));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 bg-transparent text-center font-mono text-base font-bold focus:outline-none min-w-0 w-full h-full"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 shrink-0 text-text-dim hover:text-accent hover:bg-accent/10"
                      onClick={() => updateSet(i, 'reps', set.reps + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={addSet} className="flex-1 border-border bg-background hover:bg-card text-xs font-bold uppercase tracking-wider">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Série
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-accent hover:bg-accent/90 text-background font-bold uppercase tracking-wider">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Treino
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
