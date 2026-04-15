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
    <div className="space-y-10">
      <Card className="border-border/50 bg-card text-foreground shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/50 p-6 lg:p-8">
          <CardTitle className="text-2xl font-bold tracking-tight">{editingId ? 'Editar Treino ✨' : 'Criar Novo Treino ✨'}</CardTitle>
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
            <div className="space-y-2">
              <Label htmlFor="exercises" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-2">Exercícios (separados por vírgula)</Label>
              <Input 
                id="exercises" 
                value={newExercises} 
                onChange={(e) => setNewExercises(e.target.value)}
                placeholder="Ex: Supino Reto, Crucifixo, Tríceps Corda"
                className="h-12 bg-background/50 border-border/60 text-foreground focus:border-primary rounded-2xl px-5"
              />
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.exercises.map((ex, i) => (
                      <span key={i} className="rounded-xl bg-muted/50 border border-border/30 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
