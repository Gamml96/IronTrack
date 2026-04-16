import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseSafeDate } from '../lib/dateUtils';
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
      date: format(parseSafeDate(l.date), 'dd/MM'),
      weight: Math.max(...l.sets.map(s => s.weight)),
      volume: l.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0)
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Evolução de Carga
          </h2>
        </div>
        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-full sm:w-[240px] bg-card border-border/60 text-foreground h-11 rounded-2xl shadow-sm">
            <SelectValue placeholder="Selecione o exercício" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground rounded-2xl">
            {exercises.map(ex => (
              <SelectItem key={ex} value={ex} className="text-sm font-medium">{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/40 bg-card p-6 lg:p-8 shadow-2xl rounded-3xl overflow-hidden">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="currentColor" 
                className="opacity-40"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="currentColor" 
                className="opacity-40"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}kg`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '30px', fontWeight: 'bold' }} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                name="Carga Máxima"
                stroke="var(--primary)" 
                strokeWidth={4}
                dot={{ fill: 'var(--primary)', r: 5, strokeWidth: 3, stroke: 'var(--card)' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="border-border/40 bg-card p-6 lg:p-8 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="p-0 mb-8">
          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Volume Total de Treino</CardTitle>
        </CardHeader>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                name="Volume (kg * reps)"
                stroke="var(--secondary)" 
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
