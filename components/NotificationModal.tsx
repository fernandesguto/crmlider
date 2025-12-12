
import React from 'react';
import { BellRing, Check, X, User, Sparkles, Building2 } from 'lucide-react';
import { Task, Lead, Property } from '../types';

interface NotificationModalProps {
    task?: Task | null;
    lead?: Lead | null; 
    relatedLead?: Lead | null;
    relatedProperty?: Property | null; 
    onDismiss: () => void;
    onComplete?: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ task, lead, relatedLead, relatedProperty, onDismiss, onComplete }) => {
  // MODO 1: TAREFA (Azul)
  if (task) {
      return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom duration-500">
            <div className="bg-white rounded-xl shadow-2xl border-l-4 border-blue-600 p-5 max-w-sm w-full relative">
                <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                
                <div className="flex items-start space-x-3 mb-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><BellRing size={20} /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Lembrete de Tarefa</h3>
                        <p className="text-slate-500 text-sm mt-1">{task.title}</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">Horário: {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                </div>

                {relatedLead && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100 flex items-center space-x-2">
                        <User size={16} className="text-slate-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700">Lead Vinculado</p>
                            <p className="text-sm text-slate-600 truncate">{relatedLead.name}</p>
                        </div>
                    </div>
                )}

                <div className="flex space-x-2">
                    {onComplete && (
                        <button onClick={() => { onComplete(task.id); onDismiss(); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition flex items-center justify-center space-x-1">
                            <Check size={16} /><span>Concluir</span>
                        </button>
                    )}
                    <button onClick={onDismiss} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg transition">Fechar</button>
                </div>
            </div>
        </div>
      );
  }

  // MODO 2: NOVO LEAD (Verde)
  if (lead) {
      return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom duration-500">
            <div className="bg-white rounded-xl shadow-2xl border-l-4 border-green-500 p-5 max-w-sm w-full relative">
                <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                
                <div className="flex items-start space-x-3 mb-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-full"><Sparkles size={20} /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Novo Lead Detectado!</h3>
                        <p className="text-slate-500 text-xs mt-1">Um novo cliente acabou de se cadastrar.</p>
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-100">
                    <div className="flex items-center space-x-2 mb-1">
                        <User size={16} className="text-green-600" />
                        <span className="font-bold text-slate-800">{lead.name}</span>
                    </div>
                    {relatedProperty && (
                        <div className="flex items-center space-x-2 text-xs text-slate-600 mt-2 pt-2 border-t border-green-200">
                            <Building2 size={14} className="opacity-70" />
                            <span className="truncate">Interesse: {relatedProperty.title}</span>
                        </div>
                    )}
                </div>

                <button onClick={onDismiss} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-lg transition shadow-md shadow-green-500/20">
                    Ver Leads
                </button>
            </div>
        </div>
      );
  }

  return null;
};