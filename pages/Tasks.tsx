import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { Check, Calendar, Plus, Trash } from 'lucide-react';

export const Tasks: React.FC = () => {
  const { tasks, addTask, toggleTaskCompletion, currentUser, currentAgency } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    addTask({
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      completed: false,
      assignedTo: currentUser.id,
      agencyId: currentAgency?.id || ''
    });
    setNewTaskTitle('');
    setNewTaskDate('');
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.completed ? 1 : -1;
  });

  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Minhas Tarefas</h1>
        <p className="text-slate-500 mb-8">Organize seu dia e não perca nenhum compromisso.</p>

        <form onSubmit={handleAddTask} className="flex gap-4 mb-8">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="flex-1 bg-white text-slate-900 border border-slate-200 rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="bg-white text-slate-900 border border-slate-200 rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Adicionar
          </button>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {sortedTasks.map(task => (
            <div
              key={task.id}
              className={`p-4 border-b border-slate-100 last:border-0 flex items-center justify-between group transition-colors ${
                task.completed ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleTaskCompletion(task.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 text-transparent hover:border-green-500'
                  }`}
                >
                  <Check size={14} />
                </button>
                <div className={task.completed ? 'opacity-50' : ''}>
                  <p className={`font-medium text-slate-800 ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Calendar size={12} className="mr-1" />
                    <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sortedTasks.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <p>Nenhuma tarefa cadastrada. Aproveite seu dia!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};