import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { Template, ExerciseTemplate } from '../types';

export const WorkoutTemplates: React.FC<{ user: User }> = ({ user }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newName, setNewName] = useState('');
  const [newExercises, setNewExercises] = useState<ExerciseTemplate[]>([]);
  const [newDay, setNewDay] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const daysOfWeek = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
    'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
  ];

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'templates'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t: Template[] = [];
      snapshot.forEach((doc) => {
        t.push({ id: doc.id, ...doc.data() } as Template);
      });
      setTemplates(t);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/templates`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const addExercise = () => {
    setNewExercises([...newExercises, { name: '', sets: 3, reps: 10 }]);
  };

  const updateExercise = (index: number, field: keyof ExerciseTemplate, value: string | number) => {
    const updated = [...newExercises];
    updated[index] = { ...updated[index], [field]: value };
    setNewExercises(updated);
  };

  const removeExercise = (index: number) => {
    setNewExercises(newExercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newExercises.length === 0) return;

    try {
      const data = {
        name: newName,
        exercises: newExercises,
        dayOfWeek: newDay || null,
        order: templates.length,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'templates', editingId), data);
        toast.success("Treino atualizado!");
      } else {
        await addDoc(collection(db, 'users', user.uid, 'templates'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
        toast.success("Treino criado!");
      }
      
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/templates/${editingId || ''}`);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setNewName(template.name);
    setNewExercises(template.exercises);
    setNewDay(template.dayOfWeek || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewName('');
    setNewExercises([]);
    setNewDay('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'templates', id));
      toast.success("Treino excluído!");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/templates/${id}`);
    }
  };

  return (
    <div className="space-y-10">
      <Card className="border-border/50 bg-card text-foreground shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/50 p-6 lg:p-8">
          <CardTitle className="text-2xl font-bold tracking-tight">{editingId ? 'Editar Treino 🏋️‍♂️' : 'Criar Novo Treino 🏋️‍♂️'}</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            {editingId ? 'Atualize os detalhes da sua rotina favorita' : 'Defina sua rotina semanal com carinho'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-2">Nome do Treino</Label>
              <Input 
                id="name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Peito e Tríceps"
                className="h-12 bg-background/50 border-border/60 text-foreground focus:border-primary rounded-2xl px-5"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-2">Exercícios</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExercise} className="h-8 rounded-xl text-xs font-bold">
                  <Plus className="h-3 w-3 mr-2" /> Adicionar
                </Button>
              </div>
              {newExercises.map((ex, i) => (
                <div key={i} className="flex flex-col gap-3 bg-background/50 p-4 rounded-2xl border border-border/60">
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={ex.name} 
                      onChange={(e) => updateExercise(i, 'name', e.target.value)}
                      placeholder="Nome do exercício"
                      className="h-12 bg-background border-border/60 rounded-xl flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExercise(i)} className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl shrink-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Séries</Label>
                      <Input 
                        type="number"
                        value={ex.sets} 
                        onChange={(e) => updateExercise(i, 'sets', Number(e.target.value))}
                        className="h-10 bg-background border-border/60 rounded-xl text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Reps</Label>
                      <Input 
                        type="number"
                        value={ex.reps} 
                        onChange={(e) => updateExercise(i, 'reps', Number(e.target.value))}
                        className="h-10 bg-background border-border/60 rounded-xl text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="day" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-2">Dia da Semana (Opcional)</Label>
              <select
                id="day"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="w-full h-12 px-5 rounded-2xl bg-background/50 border border-border/60 text-foreground focus:border-primary outline-none text-sm font-medium transition-all"
              >
                <option value="">Nenhum dia específico</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-12 border-border text-muted-foreground rounded-2xl font-bold">
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              )}
              <Button type="submit" className="flex-1 h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20">
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Salvar Alterações' : 'Adicionar Treino'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence>
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <Card className={`border-border/40 bg-card text-foreground h-full transition-all duration-300 rounded-3xl shadow-sm hover:shadow-md ${editingId === template.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl font-bold tracking-tight text-primary">{template.name}</CardTitle>
                    {template.dayOfWeek && (
                      <p className="text-[10px] text-secondary font-black uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded-full inline-block">{template.dayOfWeek}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleEdit(template)}
                      className="h-10 w-10 border-border/60 bg-background/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-xl"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(template.id)}
                      className="h-10 w-10 border-border/60 bg-background/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 mt-2">
                    {template.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center rounded-xl bg-muted/50 border border-border/30 px-3 py-2">
                        <span className="text-xs font-bold text-foreground">{ex.name}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {ex.sets} x {ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
