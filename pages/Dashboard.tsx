import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { Building2, Users, CheckCircle, TrendingUp, AlertTriangle, Database } from 'lucide-react';
import { PropertyType, LeadStatus } from '../types';

export const Dashboard: React.FC = () => {
  const { properties, leads, tasks, currentUser, isLoading } = useApp();

  // Metrics
  const totalProperties = properties.length;
  const newLeads = leads.filter(l => l.status === LeadStatus.NEW).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalValue = properties
    .filter(p => p.type === PropertyType.SALE)
    .reduce((acc, curr) => acc + curr.price, 0);

  // Data for Charts
  const propertiesByType = [
    { name: 'Venda', value: properties.filter(p => p.type === PropertyType.SALE).length },
    { name: 'Locação', value: properties.filter(p => p.type !== PropertyType.SALE).length },
  ];

  const leadsByStatus = [
    { name: 'Novos', value: leads.filter(l => l.status === LeadStatus.NEW).length },
    { name: 'Em Negociação', value: leads.filter(l => l.status === LeadStatus.NEGOTIATION).length },
    { name: 'Fechados', value: leads.filter(l => l.status === LeadStatus.CLOSED).length },
    { name: 'Perdidos', value: leads.filter(l => l.status === LeadStatus.LOST).length },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 transition hover:shadow-md">
      <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Bem-vindo, {currentUser.name}!</h1>
          <p className="text-slate-500 mt-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Sistema Online • Supabase Conectado
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Data de Hoje</p>
          <p className="font-semibold text-slate-800">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* RLS Warning: Se não estiver carregando e não tiver dados, pode ser RLS */}
      {!isLoading && properties.length === 0 && leads.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
             <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" />
             <div>
                <h4 className="font-bold text-amber-800">O banco de dados parece vazio</h4>
                <p className="text-sm text-amber-700 mt-1">
                   Se você já cadastrou dados ou rodou o script SQL, o Supabase pode estar bloqueando o acesso (Row Level Security).
                </p>
                <div className="mt-2 text-xs bg-white/50 p-2 rounded border border-amber-200 font-mono text-amber-900">
                   Vá no SQL Editor do Supabase e rode: <br/>
                   <code>alter table properties disable row level security;</code>
                </div>
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Building2} label="Total de Imóveis" value={totalProperties} color="bg-blue-600" />
        <StatCard icon={Users} label="Novos Leads (Mês)" value={newLeads} color="bg-emerald-500" />
        <StatCard icon={CheckCircle} label="Tarefas Pendentes" value={pendingTasks} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="VGV (Vendas)" value={`R$ ${(totalValue / 1000000).toFixed(1)}M`} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Funnel Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Funil de Vendas (Leads)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuição de Imóveis</h3>
          <div className="h-64 flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertiesByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {propertiesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {propertiesByType.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm text-slate-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Task List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Próximas Tarefas</h3>
        <div className="space-y-3">
          {tasks.slice(0, 3).map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 transition hover:bg-slate-100">
               <div className="flex items-center space-x-3">
                 <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700'}>{task.title}</span>
               </div>
               <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                 {new Date(task.dueDate).toLocaleDateString()}
               </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Nenhuma tarefa pendente. Bom trabalho!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};