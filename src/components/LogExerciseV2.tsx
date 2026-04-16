import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Loader2, Save, Plus, Minus, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { RestTimer } from './RestTimer';

interface Set {
  reps: number;
  weight: number;
}

interface LogExerciseV2Props {
  user: User;
  exerciseName: string;
  onComplete: () => void;
  initialSets: Set[];
  logId?: string;
  defaultReps: number;
  defaultWeight: number;
}

export const LogExerciseV2: React.FC<LogExerciseV2Props> = ({ 
  user, 
  exerciseName, 
  onComplete,
  initialSets,
  logId,
  defaultReps,
  defaultWeight
}) => {
  const [sets, setSets] = useState<Set[]>(() => initialSets);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load history
  useEffect(() => {
    if (!logId && exerciseName) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const q = query(
            collection(db, 'users', user.uid, 'logs'),
            where('exerciseName', '==', exerciseName),
            orderBy('date', 'desc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const lastLog = snapshot.docs[0].data();
            if (lastLog.sets && lastLog.sets.length > 0) {
              setSets(lastLog.sets.map((s: Set) => ({ ...s })));
              toast.info(`Histórico de "${exerciseName}" carregado!`);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar histórico:", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [user.uid, exerciseName, logId]);

  const addSet = () => {
    setSets([...sets, { reps: defaultReps, weight: defaultWeight }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: keyof Set, value: number) => {
    setSets(prev => prev.map((set, i) => i === index ? { ...set, [field]: value } : set));
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
    <Card className="border-border/50 bg-card text-foreground shadow-2xl rounded-[var(--radius-lg)] overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-border/50 p-4 lg:p-6">
        <CardTitle className="flex items-center justify-between text-xl font-bold tracking-tight py-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span>{logId ? `Editar: ${exerciseName}` : exerciseName}</span>
          </div>
          {loadingHistory && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardTitle>
        <div className="pt-4">
          <RestTimer />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 lg:space-y-8 p-4 lg:p-8">
        <div className="space-y-5">
          {sets.map((set, i) => (
            <div key={i} className="p-4 rounded-3xl bg-background/50 border border-border/50 space-y-4 relative group transition-all hover:border-primary/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-xl bg-primary/20 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Série</Label>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeSet(i)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-destructive/10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold ml-2">Peso (kg)</Label>
                  <div className="flex items-center bg-card rounded-2xl border border-border/60 p-1 shadow-sm h-14">
                    <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => updateSet(i, 'weight', Math.max(0, set.weight - 1))}><Minus className="h-5 w-5" /></Button>
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      value={set.weight} 
                      onChange={(e) => { 
                        const val = e.target.value.replace(',', '.'); 
                        const num = Number(val);
                        if (val === '' || (!isNaN(num) && num >= 0)) {
                          updateSet(i, 'weight', val === '' ? 0 : num); 
                        }
                      }} 
                      onFocus={(e) => e.target.select()} 
                      className="flex-1 bg-transparent text-center font-bold text-xl focus:outline-none min-w-0 w-full h-full text-foreground" 
                    />
                    <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => updateSet(i, 'weight', set.weight + 1)}><Plus className="h-5 w-5" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold ml-2">Reps</Label>
                  <div className="flex items-center bg-card rounded-2xl border border-border/60 p-1 shadow-sm h-14">
                    <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => updateSet(i, 'reps', Math.max(0, set.reps - 1))}><Minus className="h-5 w-5" /></Button>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={set.reps} 
                      onChange={(e) => { 
                        const val = e.target.value; 
                        const num = Number(val);
                        if (val === '' || (/^\d+$/.test(val) && num >= 0)) {
                          updateSet(i, 'reps', val === '' ? 0 : num); 
                        }
                      }} 
                      onFocus={(e) => e.target.select()} 
                      className="flex-1 bg-transparent text-center font-bold text-xl focus:outline-none min-w-0 w-full h-full text-foreground" 
                    />
                    <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => updateSet(i, 'reps', set.reps + 1)}><Plus className="h-5 w-5" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button variant="outline" onClick={addSet} className="flex-1 h-12 rounded-2xl border-primary/20 bg-background hover:bg-primary/5 text-primary font-bold uppercase tracking-wider text-xs">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Série
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Treino
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
