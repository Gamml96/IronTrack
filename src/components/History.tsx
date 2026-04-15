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
    <div className="space-y-4">
      <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
        <HistoryIcon className="h-4 w-4" /> Histórico Recente
      </h2>
      <div className="grid gap-3">
        {logs.map((log) => (
          <Card key={log.id} className="border-border bg-card text-text-main hover:border-accent/30 transition-colors group">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-accent tracking-tight">{log.exerciseName}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-text-dim font-mono uppercase">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(log.date), "dd MMM, HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit?.(log)}
                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {log.sets.map((set, i) => (
                  <div key={i} className="bg-background rounded px-2 py-1 text-[10px] border border-border font-mono">
                    <span className="text-text-dim mr-1">{i + 1}ª:</span>
                    <span className="font-bold text-text-main">{set.weight}kg</span>
                    <span className="mx-1 text-text-dim">x</span>
                    <span className="text-text-main">{set.reps}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-10 text-text-dim italic text-sm">
            Nenhum treino registrado ainda.
          </div>
        )}
      </div>
    </div>
  );
};
