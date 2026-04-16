import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import { Activity, Flame, Target, BarChart3, Zap } from 'lucide-react';
import { startOfDay, subDays, isSameDay, differenceInDays } from 'date-fns';

interface Log {
  id: string;
  date: string;
  sets: { reps: number; weight: number }[];
}

interface StatsHeaderProps {
  user: User;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ user }) => {
  const [stats, setStats] = useState({
    status: 'Inativo',
    consistency: 0,
    streak: 0,
    weeklyVolume: 0,
    monthlyWorkouts: 0
  });

  useEffect(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const q = query(
      collection(db, 'users', user.uid, 'logs'),
      where('date', '>=', thirtyDaysAgo.toISOString()),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: Log[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as Log);
      });

      calculateStats(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logs`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const calculateStats = (logs: Log[]) => {
    if (logs.length === 0) {
      setStats({
        status: 'Inativo',
        consistency: 0,
        streak: 0,
        weeklyVolume: 0,
        monthlyWorkouts: 0
      });
      return;
    }

    const today = startOfDay(new Date());
    const uniqueDays = new Set(logs.map(l => {
      const date = l.date && typeof (l.date as any).toDate === 'function' 
        ? (l.date as any).toDate() 
        : new Date(l.date);
      return startOfDay(date).toISOString();
    }));
    const sortedUniqueDays = Array.from(uniqueDays).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());

    // 1. Status
    const lastWorkoutDate = sortedUniqueDays[0];
    const daysSinceLast = differenceInDays(today, lastWorkoutDate);
    let status = 'Ativo';
    if (daysSinceLast > 7) status = 'Inativo';
    else if (daysSinceLast > 3) status = 'Em Pausa';

    // 2. Consistency (Target 20 workouts in 30 days = 100%)
    const consistency = Math.min(Math.round((uniqueDays.size / 20) * 100), 100);

    // 3. Streak
    let streak = 0;
    let currentCheck = today;
    
    // If didn't train today, check if trained yesterday to continue streak
    if (!isSameDay(sortedUniqueDays[0], today)) {
      currentCheck = subDays(today, 1);
    }

    for (let i = 0; i < 30; i++) {
      const dateToCheck = subDays(currentCheck, i);
      const trained = sortedUniqueDays.some(d => isSameDay(d, dateToCheck));
      if (trained) streak++;
      else break;
    }

    // 4. Weekly Volume (Last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    const weeklyLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
    const weeklyVolume = weeklyLogs.reduce((acc, log) => acc + log.sets.length, 0);

    // 5. Monthly Workouts
    const monthlyWorkouts = uniqueDays.size;

    setStats({
      status,
      consistency,
      streak,
      weeklyVolume,
      monthlyWorkouts
    });
  };

  const statItems = [
    { 
      label: 'Status', 
      value: stats.status, 
      icon: Activity, 
      color: stats.status === 'Ativo' ? 'text-success' : stats.status === 'Em Pausa' ? 'text-yellow-500' : 'text-muted-foreground' 
    },
    { 
      label: 'Consistência', 
      value: `${stats.consistency}%`, 
      icon: Target, 
      color: 'text-primary' 
    },
    { 
      label: 'Streak', 
      value: `${stats.streak} dias`, 
      icon: Flame, 
      color: 'text-orange-400' 
    },
    { 
      label: 'Volume (7d)', 
      value: `${stats.weeklyVolume} séries`, 
      icon: Zap, 
      color: 'text-secondary' 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {statItems.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring" }}
          className="bg-card border border-border/40 rounded-[var(--radius-lg)] p-4 lg:p-5 flex flex-col gap-2 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{item.label}</p>
            <div className={`p-1.5 rounded-xl bg-current/10 ${item.color}`}>
              <item.icon className={`h-3.5 w-3.5 group-hover:rotate-12 transition-transform`} />
            </div>
          </div>
          <p className={`text-base lg:text-2xl font-bold tracking-tight ${item.color}`}>
            {item.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
