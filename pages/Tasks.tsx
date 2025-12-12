import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, Lead, Property } from '../types';
import { Check, Calendar, Plus, User, Clock, Edit, X, Save, Trash2, Building2, MapPin, BedDouble, Bath, Square, Phone, Mail, Eye, History, CalendarDays, ListChecks } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Tasks: React.FC = () => {
  const { tasks, addTask, updateTask, toggleTaskCompletion, deleteTask, currentUser, currentAgency, leads, properties, users } = useApp();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedAssignedTo, setSelectedAssignedTo] = useState(currentUser?.id || '');

  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);

  const [filterMode, setFilterMode] = useState<'week' | 'history' | 'all_future'>('week');

  const formatTaskDate = (dueDate: string) => {
    if (!dueDate) return '';
    if (dueDate.includes('T')) return dueDate; 
    return `${dueDate}T12:00:00`; 
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate) {
        alert("Preencha o título e a data/hora da tarefa.");
        return;
    }

    if (isEditing && editingTaskId) {
        const taskToUpdate = tasks.find(t => t.id === editingTaskId);
        if (taskToUpdate) {
            await updateTask({
                ...taskToUpdate,
                title: newTaskTitle,
                dueDate: newTaskDate,
                leadId: selectedLeadId || undefined,
                propertyId: selectedPropertyId || undefined,
                assignedTo: selectedAssignedTo
            });
        }
    } else {
        addTask({
          id: Date.now().toString(),
          title: newTaskTitle,
          dueDate: newTaskDate, 
          completed: false,
          assignedTo: selectedAssignedTo || currentUser.id,
          agencyId: currentAgency?.id || '',
          leadId: selectedLeadId || undefined,
          propertyId: selectedPropertyId || undefined
        });
    }

    resetForm();
  };

  const handleEditClick = (task: Task) => {
      setIsEditing(true);
      setEditingTaskId(task.id);
      setNewTaskTitle(task.title);
      let dateValue = task.dueDate;
      if (dateValue.length > 16) {
          dateValue = dateValue.substring(0, 16);
      }
      setNewTaskDate(dateValue);
      setSelectedLeadId(task.leadId || '');
      setSelectedPropertyId(task.propertyId || '');
      setSelectedAssignedTo(task.assignedTo);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTaskToDelete(id);
      setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (taskToDelete) {
          await deleteTask(taskToDelete);
          if (editingTaskId === taskToDelete) resetForm();
      }
      setTaskToDelete(null);
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDate('');
    setSelectedLeadId('');
    setSelectedPropertyId('');
    setSelectedAssignedTo(currentUser?.id || '');
    setIsEditing(false);
    setEditingTaskId(null);
  };

  const getLeadObj = (leadId?: string) => {
      if (!leadId) return null;
      return leads.find(l => l.id === leadId) || null;
  };

  const getPropertyObj = (propId?: string) => {
      if (!propId) return null;
      return properties.find(p => p.id === propId) || null;
  };

  const getUserObj = (userId: string) => {
      return users.find(u => u.id === userId);
  };

  const filteredTasks = tasks.filter(t => {
      const taskDate = new Date(formatTaskDate(t.dueDate));
      taskDate.setHours(0,0,0,0); 
      
      const today = new Date();
      today.setHours(0,0,0,0);

      if (filterMode === 'week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return taskDate >= today && taskDate <= nextWeek;
      } else if (filterMode === 'history') {
          const pastLimit = new Date(today);
          pastLimit.setDate(today.getDate() - 90);
          return taskDate >= pastLimit && taskDate < today;
      } else {
          // all_future: Mostra apenas tarefas DEPOIS da semana atual (Today + 7 dias)
          const nextWeekLimit = new Date(today);
          nextWeekLimit.setDate(today.getDate() + 7);
          return taskDate > nextWeekLimit;
      }
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed === b.completed) {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return filterMode === 'history' ? dateB - dateA : dateA - dateB;
    }
    return a.completed ? 1 : -1;
  });

  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Minhas Tarefas</h1>
        <p className="text-slate-500 mb-8">Organize seu dia, agende ligações e não perca nenhum compromisso.</p>

        <div className={`p-6 rounded-xl shadow-sm border mb-8 transition-colors ${isEditing ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-bold flex items-center ${isEditing ? 'text-blue-700' : 'text-slate-800'}`}>
                    {isEditing ? <Edit size={20} className="mr-2"/> : null}
                    {isEditing ? 'Editando Tarefa' : 'Nova Tarefa'}
                </h2>
                {isEditing && (
                    <button onClick={resetForm} className="text-slate-400 hover:text-red-500 flex items-center text-sm">
                        <X size={16} className="mr-1"/> Cancelar
                    </button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-end w-full">
                    <div className="flex-1 w-full min-w-[200px] min-w-0">
                        <label className="block text-sm font-medium text-slate-700 mb-1">O que fazer?</label>
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Ex: Ligar para cliente..."
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quando?</label>
                        <input
                            type="datetime-local"
                            value={newTaskDate}
                            onChange={(e) => setNewTaskDate(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end w-full">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                        <select
                            value={selectedAssignedTo}
                            onChange={(e) => setSelectedAssignedTo(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vincular Lead</label>
                        <select
                            value={selectedLeadId}
                            onChange={(e) => setSelectedLeadId(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Sem vínculo</option>
                            {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>{lead.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vincular Imóvel</label>
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Sem vínculo</option>
                            {properties.map(prop => (
                                <option key={prop.id} value={prop.id}>#{prop.code} - {prop.title}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className={`${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center justify-center w-full md:w-auto min-w-[120px] shadow-sm`}
                    >
                        {isEditing ? (
                            <>
                                <Save size={20} className="mr-2" /> Atualizar
                            </>
                        ) : (
                            <>
                                <Plus size={20} className="mr-2" /> Agendar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Lista de Tarefas</h3>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setFilterMode('week')}
                        className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition flex items-center ${filterMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CalendarDays size={16} className="mr-2"/> Esta Semana
                    </button>
                    <button 
                        onClick={() => setFilterMode('all_future')}
                        className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition flex items-center ${filterMode === 'all_future' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ListChecks size={16} className="mr-2"/> Todas (Futuras)
                    </button>
                    <button 
                        onClick={() => setFilterMode('history')}
                        className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition flex items-center ${filterMode === 'history' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} className="mr-2"/> Anteriores
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {sortedTasks.map(task => {
                const lead = getLeadObj(task.leadId);
                const prop = getPropertyObj(task.propertyId);
                const assignedUser = getUserObj(task.assignedTo);
                const isOverdue = !task.completed && new Date(formatTaskDate(task.dueDate)) < new Date();
                const isItemEditing = task.id === editingTaskId;

                return (
                    <div
                    key={task.id}
                    className={`p-4 border-b border-slate-100 last:border-0 flex items-center justify-between group transition-colors ${
                        isItemEditing ? 'bg-blue-50' : (task.completed ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50')
                    }`}
                    >
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                            task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 text-transparent hover:border-green-500'
                        }`}
                        >
                        <Check size={14} />
                        </button>
                        <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className={`font-medium text-slate-800 min-w-0 break-words ${task.completed ? 'line-through' : ''}`}>
                                {task.title}
                            </p>
                            {assignedUser && (
                                <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title={`Responsável: ${assignedUser.name}`}>
                                    <img src={assignedUser.avatarUrl} className="w-4 h-4 rounded-full" alt={assignedUser.name} />
                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{assignedUser.name}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <div className={`flex items-center text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                <Calendar size={12} className="mr-1" />
                                <span>{new Date(formatTaskDate(task.dueDate)).toLocaleDateString('pt-BR')}</span>
                                <Clock size={12} className="ml-2 mr-1" />
                                <span>{new Date(formatTaskDate(task.dueDate)).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                            </div>
                            
                            {lead && (
                                <button 
                                    onClick={() => setViewLead(lead)}
                                    className="flex items-center text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[200px] hover:bg-blue-100 hover:shadow-sm transition cursor-pointer"
                                    title="Ver Detalhes do Lead"
                                >
                                    <User size={12} className="mr-1 flex-shrink-0" />
                                    <span className="truncate hover:underline">{lead.name}</span>
                                </button>
                            )}

                            {prop && (
                                <button 
                                    onClick={() => setViewProperty(prop)}
                                    className="flex items-center text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 truncate max-w-[250px] hover:bg-purple-100 hover:shadow-sm transition cursor-pointer"
                                    title="Ver Detalhes do Imóvel"
                                >
                                    <Building2 size={12} className="mr-1 flex-shrink-0" />
                                    <span className="truncate hover:underline">#{prop.code} - {prop.title}</span>
                                </button>
                            )}
                        </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                        <button 
                            onClick={() => handleEditClick(task)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Editar Tarefa"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => handleDeleteClick(task.id, e)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Excluir Tarefa"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    </div>
                );
            })}
            {sortedTasks.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    {filterMode === 'week' 
                        ? <p>Nenhuma tarefa agendada para os próximos 7 dias.</p>
                        : filterMode === 'all_future' 
                            ? <p>Nenhuma tarefa para as próximas semanas.</p>
                            : <p>Nenhuma tarefa registrada nos últimos 90 dias.</p>
                    }
                </div>
            )}
            </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        isDestructive
      />

      {viewProperty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="relative h-56 bg-slate-200">
                      <img src={viewProperty.images?.[0] || 'https://via.placeholder.com/600'} alt={viewProperty.title} className="w-full h-full object-cover" />
                      <button 
                          onClick={() => setViewProperty(null)} 
                          className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                      >
                          <X size={20} />
                      </button>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">{viewProperty.type}</span>
                          <span className="bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded shadow font-mono">#{viewProperty.code}</span>
                      </div>
                  </div>
                  <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{viewProperty.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center mb-4"><MapPin size={14} className="mr-1"/> {viewProperty.neighborhood}, {viewProperty.city}</p>
                      
                      <div className="flex items-center justify-between text-slate-600 text-sm py-4 border-y border-slate-100 mb-4">
                          <span className="flex items-center"><BedDouble size={16} className="mr-1 text-blue-500"/> {viewProperty.bedrooms}</span>
                          <span className="flex items-center"><Bath size={16} className="mr-1 text-blue-500"/> {viewProperty.bathrooms}</span>
                          <span className="flex items-center"><Square size={16} className="mr-1 text-blue-500"/> {viewProperty.area}m²</span>
                      </div>

                      <p className="text-2xl font-bold text-blue-600 mb-4">{formatCurrency(viewProperty.price)}</p>
                      
                      <div className="flex justify-end">
                          <button onClick={() => setViewProperty(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition">
                              Fechar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {viewLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 relative">
                  <button 
                      onClick={() => setViewLead(null)} 
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                      <X size={20} />
                  </button>

                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <User size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">{viewLead.name}</h3>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {viewLead.status}
                          </span>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex items-center space-x-3 text-slate-600">
                          <Mail size={18} className="text-slate-400" />
                          <a href={`mailto:${viewLead.email}`} className="hover:text-blue-600 hover:underline">{viewLead.email || 'Não informado'}</a>
                      </div>
                      <div className="flex items-center space-x-3 text-slate-600">
                          <Phone size={18} className="text-slate-400" />
                          <div className="flex items-center">
                              <span>{viewLead.phone || 'Não informado'}</span>
                              {viewLead.phone && (
                                  <a href={`https://wa.me/55${viewLead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 transition">
                                      WhatsApp
                                  </a>
                              )}
                          </div>
                      </div>
                      
                      {viewLead.notes && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-4">
                              <p className="text-xs font-bold text-yellow-800 mb-1 uppercase">Observações</p>
                              <p className="text-sm text-yellow-900">{viewLead.notes}</p>
                          </div>
                      )}
                  </div>

                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setViewLead(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition">
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};