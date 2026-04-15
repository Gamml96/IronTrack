import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

interface Log {
  exerciseName: string;
  date: string;
  sets: { reps: number; weight: number }[];
}

export const Progress: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exercises, setExercises] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'logs'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const l: Log[] = [];
      const exSet = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data() as Log;
        l.push(data);
        exSet.add(data.exerciseName);
      });
      setLogs(l);
      const exList = Array.from(exSet);
      setExercises(exList);
      if (exList.length > 0 && !selectedExercise) {
        setSelectedExercise(exList[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logs`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const chartData = logs
    .filter(l => l.exerciseName === selectedExercise)
    .map(l => ({
      date: format(new Date(l.date), 'dd/MM'),
      weight: Math.max(...l.sets.map(s => s.weight)),
      volume: l.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0)
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Evolução de Carga
        </h2>
        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-[200px] bg-card border-border text-text-main h-9 text-xs">
            <SelectValue placeholder="Selecione o exercício" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-text-main">
            {exercises.map(ex => (
              <SelectItem key={ex} value={ex} className="text-xs">{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card p-6 shadow-lg">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94A3B8" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                name="Carga Máxima"
                stroke="#38bdf8" 
                strokeWidth={3}
                dot={{ fill: '#38bdf8', r: 4, strokeWidth: 2, stroke: '#1e293b' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="border-border bg-card p-6 shadow-lg">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-[10px] uppercase tracking-widest text-text-dim font-bold">Volume Total de Treino</CardTitle>
        </CardHeader>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                name="Volume (kg * reps)"
                stroke="#22c55e" 
                strokeWidth={2}
                dot={false}
                fill="url(#colorVolume)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
