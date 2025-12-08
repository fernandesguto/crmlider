
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { useApp } from '../context/AppContext';
import { Building2, Users, CheckCircle, TrendingUp, AlertTriangle, Calendar, Check, DollarSign, User, Key, BarChart3, Filter, X, Mail, Phone, MapPin, BedDouble, Bath, Square } from 'lucide-react';
import { PropertyType, LeadStatus, Lead, Property } from '../types';

export const Dashboard: React.FC = () => {
  const { properties, leads, tasks, currentUser, isLoading, toggleTaskCompletion } = useApp();

  // Modal States
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);

  // Metrics
  const totalProperties = properties.length;
  const newLeads = leads.filter(l => l.status === LeadStatus.NEW).length;
  
  // Cálculo Total Geral (Histórico)
  const totalSalesComm = properties
    .filter(p => p.status === 'Sold' && !p.type.includes('Locação'))
    .reduce((acc, curr) => acc + (curr.commissionValue || 0), 0);

  const currentMonthlyRevenue = properties
    .filter(p => p.status === 'Sold' && p.type.includes('Locação'))
    .reduce((acc, curr) => acc + (curr.commissionValue || 0), 0);

  // --- DADOS PARA GRÁFICOS ---

  // 1. Comissões e Receita (Financeiro)
  const getCommissionsByMonth = () => {
      const months = 6;
      const data = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
          const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' });
          const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);

          let vendasMes = 0;
          let locacoesMes = 0;

          properties.forEach(p => {
              if (p.status !== 'Sold' || !p.soldAt) return;
              const soldDate = new Date(p.soldAt);
              const commission = p.commissionValue || 0;

              if (p.type.includes('Locação')) {
                  if (soldDate < nextMonth) locacoesMes += commission;
              } else {
                  if (soldDate >= refDate && soldDate < nextMonth) vendasMes += commission;
              }
          });

          data.push({ 
              name: monthKey, 
              Vendas: vendasMes,
              Locacao: locacoesMes,
          });
      }
      return data;
  };

  // 2. Valor Geral de Vendas (VGV) - Total vendido no mês (Preço do Imóvel)
  const getSalesValueByMonth = () => {
      const months = 6;
      const data = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
          const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' });
          const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);

          let vgvMes = 0;

          properties.forEach(p => {
              if (p.status !== 'Sold' || !p.soldAt) return;
              // Ignora locações, queremos saber de VENDA de imóveis
              if (p.type.includes('Locação')) return;

              const soldDate = new Date(p.soldAt);
              const price = p.salePrice || 0;

              if (soldDate >= refDate && soldDate < nextMonth) {
                  vgvMes += price;
              }
          });

          data.push({ name: monthKey, Valor: vgvMes });
      }
      return data;
  };

  // 3. Funil de Vendas (Leads por Status)
  const getFunnelData = () => {
      const counts = {
          [LeadStatus.NEW]: 0,
          [LeadStatus.CONTACTED]: 0,
          [LeadStatus.VISITING]: 0,
          [LeadStatus.NEGOTIATION]: 0,
          [LeadStatus.CLOSED]: 0
      };

      leads.forEach(l => {
          if (counts[l.status] !== undefined) {
              counts[l.status]++;
          }
      });

      return [
          { name: 'Novos', value: counts[LeadStatus.NEW], fill: '#3b82f6' }, // Blue
          { name: 'Contatados', value: counts[LeadStatus.CONTACTED], fill: '#f59e0b' }, // Amber
          { name: 'Em Visita', value: counts[LeadStatus.VISITING], fill: '#a855f7' }, // Purple
          { name: 'Negociação', value: counts[LeadStatus.NEGOTIATION], fill: '#f97316' }, // Orange
          { name: 'Fechados', value: counts[LeadStatus.CLOSED], fill: '#22c55e' }, // Green
      ];
  };

  const commissionsData = getCommissionsByMonth();
  const salesValueData = getSalesValueByMonth();
  const funnelData = getFunnelData();

  // 4. Status dos Imóveis (Pizza)
  const propertiesStatus = [
    { name: 'Disponível', value: properties.filter(p => p.status === 'Active').length, color: '#3b82f6' },
    { name: 'Vendido', value: properties.filter(p => p.status === 'Sold' && !p.type.includes('Locação')).length, color: '#10b981' },
    { name: 'Locado', value: properties.filter(p => p.status === 'Sold' && p.type.includes('Locação')).length, color: '#8b5cf6' },
  ];

  // --- TAREFAS DA SEMANA ---
  const getSafeDate = (dateStr: string) => {
      const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
      return new Date(finalStr);
  };

  const today = new Date();
  today.setHours(0,0,0,0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const weeklyTasks = tasks
    .filter(t => !t.completed)
    .filter(t => {
        const tDate = getSafeDate(t.dueDate);
        return tDate <= nextWeek; 
    })
    .sort((a, b) => getSafeDate(a.dueDate).getTime() - getSafeDate(b.dueDate).getTime());

  const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition hover:shadow-md">
      <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-8 space-y-8 h-screen overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Bem-vindo, {currentUser.name}!</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Data de Hoje</p>
          <p className="font-semibold text-slate-800">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* --- 1. TAREFAS (PRIORIDADE) --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Tarefas da Semana
                <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{weeklyTasks.length} pendentes</span>
            </h3>
            <div className="space-y-2">
            {weeklyTasks.slice(0, 3).map(task => {
                const taskDate = getSafeDate(task.dueDate);
                const isOverdue = taskDate < new Date();
                const linkedLead = leads.find(l => l.id === task.leadId);
                const linkedProp = properties.find(p => p.id === task.propertyId);

                return (
                    <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 transition hover:bg-white hover:shadow-md group">
                    <div className="flex items-start sm:items-center space-x-3 w-full min-w-0">
                        <button onClick={() => toggleTaskCompletion(task.id)} className="mt-1 sm:mt-0 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 text-transparent hover:text-green-500 flex items-center justify-center transition-all flex-shrink-0" title="Marcar como feita">
                            <Check size={12} strokeWidth={3} />
                        </button>
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span className="text-slate-700 font-medium break-words min-w-0">{task.title}</span>
                            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                                <span className={`text-xs flex items-center flex-shrink-0 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                    {isOverdue && <AlertTriangle size={10} className="mr-1" />}
                                    {taskDate.toLocaleDateString('pt-BR')} • {taskDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                
                                {linkedLead && (
                                    <button 
                                        onClick={() => setViewLead(linkedLead)}
                                        className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center max-w-[200px] hover:bg-blue-100 cursor-pointer transition" 
                                        title="Ver Detalhes do Lead"
                                    >
                                        <User size={10} className="mr-1 flex-shrink-0" /> <span className="truncate">{linkedLead.name}</span>
                                    </button>
                                )}

                                {linkedProp && (
                                    <button 
                                        onClick={() => setViewProperty(linkedProp)}
                                        className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 flex items-center max-w-[200px] hover:bg-purple-100 cursor-pointer transition" 
                                        title="Ver Detalhes do Imóvel"
                                    >
                                        <Building2 size={10} className="mr-1 flex-shrink-0" /> <span className="truncate">#{linkedProp.code} - {linkedProp.title}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                );
            })}
            {weeklyTasks.length === 0 && (
                <div className="text-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-slate-600 font-medium text-sm flex items-center justify-center">
                        <CheckCircle className="mr-2 text-green-500" size={16} />
                        Tudo limpo! Nenhuma tarefa pendente para esta semana.
                    </p>
                </div>
            )}
            </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Building2} label="Total de Imóveis" value={totalProperties} color="bg-blue-600" />
        <StatCard icon={Users} label="Novos Leads" value={newLeads} color="bg-emerald-500" />
        <StatCard icon={DollarSign} label="Comissões (Vendas)" value={formatCurrency(totalSalesComm)} subtext="Total acumulado" color="bg-green-600" />
        <StatCard icon={Key} label="Receita Mensal (Loc)" value={formatCurrency(currentMonthlyRevenue)} subtext="Recorrência atual" color="bg-purple-600" />
      </div>

      {/* --- 2. VENDAS E FUNIL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Gráfico VGV (Valor Geral de Vendas) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <TrendingUp className="mr-2 text-green-600" size={20}/>
                Valor Total de Vendas (VGV)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesValueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="Valor" name="Valor Vendido" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funil de Vendas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Filter className="mr-2 text-blue-600" size={20}/>
                Funil de Vendas (Leads)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} barSize={30}>
                    {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    {/* Label dentro da barra */}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* --- 3. FINANCEIRO E CARTEIRA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales Chart (Commission) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <BarChart3 className="mr-2 text-emerald-600" size={20}/>
              Histórico de Comissões (Receita)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="Vendas" name="Comissão Vendas" fill="#3b82f6" stackId="a" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rental Revenue Chart (Area) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <TrendingUp className="mr-2 text-purple-600" size={20}/>
              Receita Recorrente (Locação)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={commissionsData}>
                <defs>
                  <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Locacao" name="Receita Locação" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Property Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-800 mb-2 w-full text-left">Distribuição da Carteira</h3>
          <div className="w-full h-[250px] relative max-w-md">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertiesStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {propertiesStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                    <span className="text-3xl font-bold text-slate-800 block">{totalProperties}</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Imóveis</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VISUALIZAÇÃO DE IMÓVEL */}
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

      {/* MODAL VISUALIZAÇÃO DE LEAD */}
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
