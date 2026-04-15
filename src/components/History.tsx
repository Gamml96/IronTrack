import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, doc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Card, CardContent } from './ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History as HistoryIcon, Calendar, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Log {
  id: string;
  exerciseName: string;
  date: string;
  sets: { reps: number; weight: number }[];
}

interface HistoryProps {
  user: User;
  onEdit?: (log: Log) => void;
}

export const History: React.FC<HistoryProps> = ({ user, onEdit }) => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'logs'),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const l: Log[] = [];
      snapshot.forEach((doc) => {
        l.push({ id: doc.id, ...doc.data() } as Log);
      });
      setLogs(l);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logs`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'logs', logId));
      toast.success("Registro excluído!");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/logs/${logId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <HistoryIcon className="h-4 w-4 text-primary" /> Histórico Recente
        </h2>
      </div>
      <div className="grid gap-4">
        {logs.map((log) => (
          <Card key={log.id} className="border-border/40 bg-card/80 backdrop-blur-sm text-foreground hover:border-primary/30 transition-all duration-300 group shadow-sm hover:shadow-md rounded-3xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-primary tracking-tight leading-none">{log.exerciseName}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(log.date), "dd MMM, HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit?.(log)}
                    className="p-2.5 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="p-2.5 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {log.sets.map((set, i) => (
                  <div key={i} className="bg-background/60 rounded-xl px-3 py-1.5 text-[11px] border border-border/50 font-semibold shadow-sm">
                    <span className="text-muted-foreground mr-1.5">{i + 1}ª:</span>
                    <span className="text-foreground">{set.weight}kg</span>
                    <span className="mx-1.5 text-muted-foreground">x</span>
                    <span className="text-foreground">{set.reps}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground italic text-sm bg-primary/5 rounded-3xl border border-dashed border-primary/20">
            Nenhum treino registrado ainda. ✨
          </div>
        )}
      </div>
    </div>
  );
};
