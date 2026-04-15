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

interface Template {
  id: string;
  name: string;
  exercises: string[];
  dayOfWeek?: string;
}

export const WorkoutTemplates: React.FC<{ user: User }> = ({ user }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newName, setNewName] = useState('');
  const [newExercises, setNewExercises] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newExercises) return;

    try {
      const data = {
        name: newName,
        exercises: newExercises.split(',').map(e => e.trim()).filter(e => e !== ''),
        dayOfWeek: newDay || null,
        order: templates.length, // Default order for new templates
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
    setNewExercises(template.exercises.join(', '));
    setNewDay(template.dayOfWeek || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewName('');
    setNewExercises('');
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
    <div className="space-y-6">
      <Card className="border-border bg-card text-text-main shadow-lg">
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Treino' : 'Criar Novo Treino'}</CardTitle>
          <CardDescription className="text-text-dim">
            {editingId ? 'Atualize os detalhes da sua rotina' : 'Defina sua rotina semanal'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-text-dim">Nome do Treino</Label>
              <Input 
                id="name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Peito e Tríceps"
                className="bg-background border-border text-text-main focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercises" className="text-xs uppercase tracking-wider text-text-dim">Exercícios (separados por vírgula)</Label>
              <Input 
                id="exercises" 
                value={newExercises} 
                onChange={(e) => setNewExercises(e.target.value)}
                placeholder="Ex: Supino Reto, Crucifixo, Tríceps Corda"
                className="bg-background border-border text-text-main focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day" className="text-xs uppercase tracking-wider text-text-dim">Dia da Semana (Opcional)</Label>
              <select
                id="day"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-text-main focus:border-accent outline-none text-sm"
              >
                <option value="">Nenhum dia específico</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-border text-text-dim">
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              )}
              <Button type="submit" className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-background font-bold">
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Salvar Alterações' : 'Adicionar Treino'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`border-border bg-card text-text-main h-full transition-all ${editingId === template.id ? 'border-accent ring-1 ring-accent' : 'hover:border-accent/50'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold tracking-tight">{template.name}</CardTitle>
                    {template.dayOfWeek && (
                      <p className="text-[10px] text-accent font-bold uppercase tracking-widest">{template.dayOfWeek}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleEdit(template)}
                      className="h-9 w-9 border-border bg-background/50 text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(template.id)}
                      className="h-9 w-9 border-border bg-background/50 text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.exercises.map((ex, i) => (
                      <span key={i} className="rounded bg-background border border-border px-3 py-1 text-[10px] font-mono text-text-dim uppercase tracking-wider">
                        {ex}
                      </span>
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
