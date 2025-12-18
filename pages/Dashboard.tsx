
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, LabelList } from 'recharts';
import { useApp } from '../context/AppContext';
import { Building2, Users, CheckCircle, TrendingUp, AlertTriangle, Calendar, Check, DollarSign, User, Key, BarChart3, Filter, X, Mail, Phone, MapPin, BedDouble, Bath, Square, Trophy, Target, Percent, Layout, Settings2, Plus, Eye, ListChecks, UserPlus, ChevronLeft, ChevronRight, Clock, PieChart as PieChartIcon, Share2 } from 'lucide-react';
import { PropertyType, LeadStatus, Lead, Property, Task, User as UserType } from '../types';

const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => {
  // Ajuste para garantir contraste correto: Fundo sempre tom 100, Ícone mantém a cor original definida no widget
  const bgClass = color.replace(/-\d+/, '-100'); 
  const textClass = color.replace('bg-', 'text-');

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 md:space-x-4 transition hover:shadow-md h-full">
      <div className={`p-3 md:p-4 rounded-full ${bgClass} flex-shrink-0`}>
        <Icon className={`${textClass} md:w-6 md:h-6`} size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs md:text-sm font-medium truncate">{label}</p>
        <h3 className="text-lg md:text-2xl font-bold text-slate-800 truncate">{value}</h3>
        {subtext && <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1 truncate">{subtext}</p>}
      </div>
    </div>
  );
};

interface SimpleCalendarProps {
    tasks: Task[];
    leads: Lead[];
    properties: Property[];
    users: UserType[];
    onToggleTask: (id: string) => void;
}

const SimpleCalendar = ({ tasks, leads, properties, users, onToggleTask }: SimpleCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayData, setSelectedDayData] = useState<{date: Date, tasks: Task[]} | null>(null);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    const getTasksForDay = (day: number) => {
        return tasks.filter(t => {
            if (t.completed) return false;
            const tDate = new Date(t.dueDate);
            return tDate.getDate() === day &&
                   tDate.getMonth() === currentDate.getMonth() &&
                   tDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const handleDayClick = (day: number, dayTasks: Task[]) => {
        if (dayTasks.length > 0) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            setSelectedDayData({ date, tasks: dayTasks });
        }
    };

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 md:h-9"></div>);
        }
        
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

        for (let i = 1; i <= daysInMonth; i++) {
            const dayTasks = getTasksForDay(i);
            const hasTasks = dayTasks.length > 0;
            const isToday = isCurrentMonth && today.getDate() === i;

            days.push(
                <div 
                    key={i} 
                    onClick={() => handleDayClick(i, dayTasks)}
                    className={`h-8 md:h-9 flex flex-col items-center justify-center relative rounded-lg transition text-sm 
                        ${isToday ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-700 hover:bg-slate-100'}
                        ${hasTasks ? 'cursor-pointer hover:bg-blue-50' : ''}
                    `} 
                    title={hasTasks ? `${dayTasks.length} tarefas` : ''}
                >
                    <span className="z-10">{i}</span>
                    {hasTasks && (
                        <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-red-500'}`}></span>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"><ChevronLeft size={18}/></button>
                <span className="font-bold text-slate-700 capitalize text-sm">{monthName}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"><ChevronRight size={18}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-[10px] font-bold text-slate-400 uppercase">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                {renderDays()}
            </div>

            {selectedDayData && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-2">
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-xl" onClick={() => setSelectedDayData(null)}></div>
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-[320px] z-30 animate-in zoom-in-95 duration-200 flex flex-col max-h-[95%] overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center">
                                <Calendar size={14} className="mr-2 text-blue-600" />
                                {selectedDayData.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </h4>
                            <button onClick={() => setSelectedDayData(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-2 flex-1">
                            {getTasksForDay(selectedDayData.date.getDate()).length > 0 ? (
                                getTasksForDay(selectedDayData.date.getDate()).map(task => {
                                    const linkedLead = leads.find(l => l.id === task.leadId);
                                    const linkedProp = properties.find(p => p.id === task.propertyId);
                                    const assignedTo = users.find(u => u.id === task.assignedTo);

                                    return (
                                        <div key={task.id} className="flex items-start space-x-2 p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-300 transition group">
                                            <button 
                                                onClick={() => onToggleTask(task.id)}
                                                className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 text-transparent hover:border-green-500 hover:text-green-500 hover:bg-green-50 flex items-center justify-center flex-shrink-0 transition-all"
                                                title="Concluir Tarefa"
                                            >
                                                <Check size={12} strokeWidth={4} />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-bold text-slate-800 leading-tight mr-2">{task.title}</p>
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center flex-shrink-0">
                                                        <Clock size={10} className="mr-1"/>
                                                        {new Date(task.dueDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-1 mt-2">
                                                    {linkedLead && (
                                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
                                                            <User size={12} className="mr-1.5 flex-shrink-0" />
                                                            <span className="truncate font-medium">{linkedLead.name}</span>
                                                        </div>
                                                    )}
                                                    {linkedProp && (
                                                        <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded truncate">
                                                            <Building2 size={12} className="mr-1.5 flex-shrink-0" />
                                                            <span className="truncate font-medium">#{linkedProp.code} {linkedProp.title}</span>
                                                        </div>
                                                    )}
                                                    {assignedTo && (
                                                        <div className="flex items-center text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-50">
                                                            <span className="mr-1">Resp:</span>
                                                            <img src={assignedTo.avatarUrl} className="w-3 h-3 rounded-full mr-1"/>
                                                            <span>{assignedTo.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-400">
                                    Todas as tarefas concluídas!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Dashboard: React.FC = () => {
  const { properties, leads, tasks, currentUser, toggleTaskCompletion, users, financialRecords } = useApp();
  const [showConfig, setShowConfig] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
  const [taskFilter, setTaskFilter] = useState<'week' | 'all'>('week');
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.status === 'Active').length;
  const totalLeads = leads.length;
  const soldProperties = properties.filter(p => p.status === 'Sold' && !p.type.includes('Locação'));
  const rentedProperties = properties.filter(p => p.status === 'Sold' && p.type.includes('Locação'));
  
  const totalSalesComm = soldProperties.reduce((acc, curr) => acc + (curr.commissionValue || 0), 0);
  const currentMonthlyRevenue = rentedProperties.reduce((acc, curr) => acc + (curr.commissionValue || 0), 0);
  
  const totalSalesValue = soldProperties.reduce((acc, curr) => acc + (curr.salePrice || 0), 0);
  const averageTicket = soldProperties.length > 0 ? totalSalesValue / soldProperties.length : 0;
  
  const closedLeadsCount = leads.filter(l => l.status === LeadStatus.CLOSED).length;
  const conversionRate = leads.length > 0 ? (closedLeadsCount / leads.length) * 100 : 0;

  const getCommissionsByMonth = () => {
      const months = 6;
      const data = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
          const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' });
          const startMonth = refDate;
          const endMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59);
          
          let vendasMes = 0;
          let locacoesMes = 0;
          
          properties.forEach(p => {
              if (p.status !== 'Sold' || !p.soldAt) return;
              const soldDate = new Date(p.soldAt);
              const commission = p.commissionValue || 0;
              
              if (p.type.includes('Locação')) {
                  if (soldDate <= endMonth) locacoesMes += commission;
              } else {
                  if (soldDate >= startMonth && soldDate <= endMonth) vendasMes += commission;
              }
          });

          if (financialRecords) {
              financialRecords.forEach(rec => {
                  const recDate = new Date(rec.date);
                  const commission = rec.commission || 0;
                  if (rec.type === 'Rental') {
                      const recEndDate = rec.endDate ? new Date(rec.endDate) : null;
                      if (recDate <= endMonth && (!recEndDate || recEndDate > startMonth)) locacoesMes += commission;
                  } else {
                      if (recDate >= startMonth && recDate <= endMonth) vendasMes += commission;
                  }
              });
          }
          data.push({ name: monthKey, Vendas: vendasMes, Locacao: locacoesMes });
      }
      return data;
  };

  const getCommissionSplitData = () => {
      const months = 6;
      const data = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' });
        const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
        let agencyTotal = 0;
        let brokerTotal = 0;
        properties.forEach(p => {
            if (p.status === 'Sold' && p.soldAt && p.commissionDistribution) {
                const soldDate = new Date(p.soldAt);
                if (soldDate >= refDate && soldDate < nextMonth) {
                    p.commissionDistribution.forEach(split => {
                        if (split.beneficiaryType === 'Agency') agencyTotal += split.value;
                        else brokerTotal += split.value;
                    });
                }
            }
        });
        data.push({ name: monthKey, Imobiliária: agencyTotal, Corretores: brokerTotal });
      }
      return data;
  };

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
              if (p.type.includes('Locação')) return;
              const soldDate = new Date(p.soldAt);
              if (soldDate >= refDate && soldDate < nextMonth) vgvMes += (p.salePrice || 0);
          });
          if (financialRecords) {
              financialRecords.forEach(rec => {
                  if (rec.type !== 'Sale') return;
                  const recDate = new Date(rec.date);
                  if (recDate >= refDate && recDate < nextMonth) vgvMes += (rec.value || 0);
              });
          }
          data.push({ name: monthKey, Valor: vgvMes });
      }
      return data;
  };

  const getLeadsByMonth = () => {
      const months = 6;
      const data = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
          const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' });
          const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
          const count = leads.filter(l => {
              const d = new Date(l.createdAt);
              return d >= refDate && d < nextMonth;
          }).length;
          data.push({ name: monthKey, Leads: count });
      }
      return data;
  };

  const getLeadsBySource = () => {
      const counts: Record<string, number> = {};
      leads.forEach(l => {
          const src = l.source || 'Não informado';
          counts[src] = (counts[src] || 0) + 1;
      });
      return Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
  };

  const getFunnelData = () => {
      const counts: any = { [LeadStatus.NEW]: 0, [LeadStatus.CONTACTED]: 0, [LeadStatus.VISITING]: 0, [LeadStatus.NEGOTIATION]: 0, [LeadStatus.CLOSED]: 0 };
      leads.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });
      return [
          { name: 'Novos', value: counts[LeadStatus.NEW], fill: '#3b82f6' },
          { name: 'Contatados', value: counts[LeadStatus.CONTACTED], fill: '#f59e0b' },
          { name: 'Em Visita', value: counts[LeadStatus.VISITING], fill: '#a855f7' },
          { name: 'Negociação', value: counts[LeadStatus.NEGOTIATION], fill: '#f97316' },
          { name: 'Fechados', value: counts[LeadStatus.CLOSED], fill: '#22c55e' },
      ];
  };

  const commissionsData = getCommissionsByMonth();
  const salesValueData = getSalesValueByMonth();
  const leadsGrowthData = getLeadsByMonth();
  const funnelData = getFunnelData();
  const splitData = getCommissionSplitData();
  const leadsSourceData = getLeadsBySource();

  const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

  const getTopBrokers = () => {
      const brokerStats: Record<string, number> = {};
      soldProperties.forEach(p => { 
          const actualSellerId = p.soldByUserId || p.brokerId;
          if (actualSellerId) brokerStats[actualSellerId] = (brokerStats[actualSellerId] || 0) + (p.salePrice || 0);
      });
      if (financialRecords) {
        financialRecords.forEach(rec => {
            if (rec.type === 'Sale' && rec.brokerId) brokerStats[rec.brokerId] = (brokerStats[rec.brokerId] || 0) + (rec.value || 0);
        });
      }
      return Object.entries(brokerStats)
          .map(([brokerId, value]) => {
              const broker = users.find(u => u.id === brokerId);
              return { name: broker?.name || 'Desconhecido', avatar: broker?.avatarUrl, value };
          })
          .sort((a, b) => b.value - a.value).slice(0, 5);
  };
  const topBrokers = getTopBrokers();

  const getBrokerCommissions = () => {
      const brokerStats: Record<string, number> = {};
      soldProperties.forEach(p => { 
          if (p.commissionDistribution && p.commissionDistribution.length > 0) {
              p.commissionDistribution.forEach(split => {
                  if (split.beneficiaryType === 'Broker') brokerStats[split.beneficiaryId] = (brokerStats[split.beneficiaryId] || 0) + (split.value || 0);
              });
          } else {
              const actualSellerId = p.soldByUserId || p.brokerId;
              if (actualSellerId) brokerStats[actualSellerId] = (brokerStats[actualSellerId] || 0) + (p.commissionValue || 0);
          }
      });
      if (financialRecords) {
        financialRecords.forEach(rec => {
            if (rec.brokerId) brokerStats[rec.brokerId] = (brokerStats[rec.brokerId] || 0) + (rec.commission || 0);
        });
      }
      return Object.entries(brokerStats)
          .map(([brokerId, value]) => {
              const broker = users.find(u => u.id === brokerId);
              return { name: broker?.name || 'Desconhecido', value };
          })
          .sort((a, b) => b.value - a.value);
  };
  const brokerCommissionsData = getBrokerCommissions();

  const getSafeDate = (dateStr: string) => { const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`; return new Date(finalStr); };
  const today = new Date(); today.setHours(0,0,0,0);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  
  const visibleTasks = tasks
    .filter(t => !t.completed)
    .filter(t => { 
        const tDate = getSafeDate(t.dueDate); 
        if (taskFilter === 'week') return tDate <= nextWeek; 
        return true; 
    })
    .sort((a, b) => getSafeDate(a.dueDate).getTime() - getSafeDate(b.dueDate).getTime());

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const currencyFormatter = (val: number) => val >= 1000000 ? `R$ ${(val/1000000).toFixed(1)}M` : val >= 1000 ? `R$ ${(val/1000).toFixed(0)}k` : `R$ ${val}`;
  
  const WIDGETS = [
      { id: 'kpi_tasks', label: 'Lista de Tarefas da Semana', type: 'full', default: true },
      { id: 'kpi_props', label: 'Total de Imóveis', type: 'kpi', default: true, component: <StatCard icon={Building2} label="Total de Imóveis" value={totalProperties} color="bg-blue-600" /> },
      { id: 'kpi_leads', label: 'Total de Leads', type: 'kpi', default: true, component: <StatCard icon={Users} label="Total de Leads" value={totalLeads} color="bg-emerald-500" /> },
      { id: 'kpi_comm', label: 'Comissões (Vendas)', type: 'kpi', default: true, component: <StatCard icon={DollarSign} label="Comissões (Vendas)" value={formatCurrency(totalSalesComm)} subtext="Total acumulado" color="bg-green-600" /> },
      { id: 'kpi_rent', label: 'Receita Mensal (Loc)', type: 'kpi', default: true, component: <StatCard icon={Key} label="Receita Mensal (Loc)" value={formatCurrency(currentMonthlyRevenue)} subtext="Recorrência atual" color="bg-purple-600" /> },
      { id: 'kpi_ticket', label: 'Ticket Médio', type: 'kpi', default: true, component: <StatCard icon={Target} label="Ticket Médio (Vendas)" value={formatCurrency(averageTicket)} color="bg-indigo-600" /> },
      { id: 'kpi_conv', label: 'Taxa de Conversão', type: 'kpi', default: true, component: <StatCard icon={Percent} label="Taxa de Conversão" value={`${conversionRate.toFixed(1)}%`} subtext="Leads fechados / Total" color="bg-amber-500" /> },
      { id: 'kpi_vgv', label: 'Total Vendido (VGV)', type: 'kpi', default: true, component: <StatCard icon={Trophy} label="Total Vendido (VGV)" value={formatCurrency(totalSalesValue)} subtext="Volume total" color="bg-rose-500" /> },
      { id: 'kpi_active', label: 'Imóveis Ativos', type: 'kpi', default: false, component: <StatCard icon={CheckCircle} label="Imóveis Ativos" value={activeProperties} color="bg-cyan-500" /> },
      { id: 'widget_calendar', label: 'Calendário de Tarefas', type: 'chart_med', default: true },
      { id: 'chart_top', label: 'Ranking de Corretores', type: 'chart_small', default: true },
      { id: 'chart_split', label: 'Distribuição de Comissões', type: 'chart_med', default: true },
      { id: 'chart_broker_comm', label: 'Comissões por Corretor', type: 'chart_med', default: true },
      { id: 'chart_vgv', label: 'Gráfico VGV Mensal', type: 'chart_large', default: true },
      { id: 'chart_leads_growth', label: 'Novos Leads por Mês', type: 'chart_med', default: true },
      { id: 'chart_funnel', label: 'Funil de Vendas', type: 'chart_med', default: true },
      { id: 'chart_comm', label: 'Histórico Comissões', type: 'chart_med', default: true },
      { id: 'chart_sources', label: 'Origem dos Leads', type: 'chart_med', default: true },
  ];

  useEffect(() => {
      const saved = localStorage.getItem('imob_dashboard_widgets');
      if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed.includes('chart_sources')) {
              const updated = [...parsed, 'chart_sources'];
              setActiveWidgetIds(updated);
              localStorage.setItem('imob_dashboard_widgets', JSON.stringify(updated));
          } else setActiveWidgetIds(parsed);
      } else setActiveWidgetIds(WIDGETS.filter(w => w.default).map(w => w.id));
  }, []);

  const toggleWidget = (id: string) => {
      const newIds = activeWidgetIds.includes(id) ? activeWidgetIds.filter(wid => wid !== id) : [...activeWidgetIds, id];
      setActiveWidgetIds(newIds);
      localStorage.setItem('imob_dashboard_widgets', JSON.stringify(newIds));
  };

  const isActive = (id: string) => activeWidgetIds.includes(id);

  const renderTasksWidget = () => (
    <div className="col-span-full bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} /> 
                {taskFilter === 'week' ? 'Tarefas da Semana' : 'Todas as Tarefas Futuras'}
                <span className="ml-3 text-[10px] md:text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{visibleTasks.length} pendentes</span>
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setTaskFilter('week')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${taskFilter === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Esta Semana</button>
                <button onClick={() => setTaskFilter('all')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${taskFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todas</button>
            </div>
        </div>
        <div className="space-y-2">
        {visibleTasks.slice(0, 5).map(task => { 
            const taskDate = getSafeDate(task.dueDate);
            const isOverdue = taskDate < new Date();
            const linkedLead = leads.find(l => l.id === task.leadId);
            const linkedProp = properties.find(p => p.id === task.propertyId);
            const assignedUser = users.find(u => u.id === task.assignedTo);
            return (
                <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 transition hover:bg-white hover:shadow-md">
                <div className="flex items-start sm:items-center space-x-3 w-full min-w-0">
                    <button onClick={() => toggleTaskCompletion(task.id)} className="mt-1 sm:mt-0 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 text-transparent hover:text-green-500 flex items-center justify-center transition-all flex-shrink-0"><Check size={12} strokeWidth={3} /></button>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="text-slate-700 font-medium break-words text-sm md:text-base min-w-0">{task.title}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                            <span className={`text-[10px] md:text-xs flex items-center flex-shrink-0 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>{isOverdue && <AlertTriangle size={10} className="mr-1" />}{taskDate.toLocaleDateString('pt-BR')} • {taskDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            {assignedUser && <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title={`Responsável: ${assignedUser.name}`}><img src={assignedUser.avatarUrl} className="w-4 h-4 rounded-full" /><span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{assignedUser.name}</span></div>}
                            {linkedLead && <button onClick={() => setViewLead(linkedLead)} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center hover:bg-blue-100 max-w-[120px] truncate"><User size={10} className="mr-1"/>{linkedLead.name}</button>}
                            {linkedProp && <button onClick={() => setViewProperty(linkedProp)} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 flex items-center hover:bg-purple-100 max-w-[200px] truncate" title={linkedProp.title}><Building2 size={10} className="mr-1 flex-shrink-0"/><span className="truncate">#{linkedProp.code} {linkedProp.title}</span></button>}
                        </div>
                    </div>
                </div>
                </div>
            )
        })}
        {visibleTasks.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">Nenhuma tarefa pendente para o período.</p>}
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard</h1><p className="text-slate-500 text-sm md:text-base">Visão geral da sua imobiliária</p></div>
        <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition ${showConfig ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`} title="Personalizar Dashboard"><Settings2 size={20} /></button>
      </div>

      {showConfig && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8 animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center"><Layout className="mr-2" size={20}/> Personalizar Widgets</h3><button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {WIDGETS.map(widget => (
                      <button key={widget.id} onClick={() => toggleWidget(widget.id)} className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-between transition ${isActive(widget.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}><span>{widget.label}</span>{isActive(widget.id) && <CheckCircle size={16} className="text-blue-600" />}</button>
                  ))}
              </div>
          </div>
      )}

      {isActive('kpi_tasks') && renderTasksWidget()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {WIDGETS.filter(w => w.type === 'kpi' && isActive(w.id)).map(w => (
              <div key={w.id} className="animate-in fade-in zoom-in duration-300">{w.component}</div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {isActive('chart_vgv') && (
            <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><BarChart3 className="mr-2 text-green-600" size={20}/> Evolução de Vendas (VGV)</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={salesValueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={currencyFormatter} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                        <Bar dataKey="Valor" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50}>
                             <LabelList dataKey="Valor" position="top" formatter={currencyFormatter} fill="#10b981" fontSize={11} fontStyle="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          )}

          {isActive('widget_calendar') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-auto min-h-[22rem]">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Calendar className="mr-2 text-blue-500" size={20}/> Calendário</h3>
                <SimpleCalendar tasks={tasks} onToggleTask={toggleTaskCompletion} leads={leads} properties={properties} users={users} />
            </div>
          )}

          {isActive('chart_comm') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><TrendingUp className="mr-2 text-blue-600" size={20}/> Comissões (Vendas vs Locação)</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={commissionsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                        <Legend />
                        <Area type="monotone" dataKey="Vendas" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="Locacao" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          )}

          {isActive('chart_split') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><PieChartIcon className="mr-2 text-purple-600" size={20}/> Distribuição de Comissões</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={splitData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={{fill: 'transparent'}} />
                        <Legend />
                        <Bar dataKey="Imobiliária" stackId="a" fill="#8b5cf6" barSize={40}>
                            <LabelList dataKey="Imobiliária" position="center" formatter={currencyFormatter} fill="#fff" fontSize={10} fontWeight="bold" />
                        </Bar>
                        <Bar dataKey="Corretores" stackId="a" fill="#3b82f6" barSize={40}>
                            <LabelList dataKey="Corretores" position="top" formatter={currencyFormatter} fill="#3b82f6" fontSize={11} fontWeight="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          )}

          {isActive('chart_leads_growth') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><UserPlus className="mr-2 text-cyan-600" size={20}/> Novos Leads por Mês</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={leadsGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Leads" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={50}>
                            <LabelList dataKey="Leads" position="top" fill="#06b6d4" fontSize={11} fontWeight="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          )}

          {isActive('chart_sources') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Share2 className="mr-2 text-indigo-500" size={20}/> Origem dos Leads</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                        <Pie
                            data={leadsSourceData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            label={({ name, value }) => `${value}`}
                        >
                            {leadsSourceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          )}

          {isActive('chart_funnel') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Filter className="mr-2 text-amber-500" size={20}/> Funil de Vendas (Leads)</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                            <LabelList dataKey="value" position="right" fill="#64748b" fontSize={12} fontWeight="bold" />
                            {funnelData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          )}
          
          {isActive('chart_broker_comm') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Trophy className="mr-2 text-yellow-500" size={20}/> Ranking de Comissões</h3>
                 {brokerCommissionsData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={brokerCommissionsData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                                <LabelList dataKey="value" position="right" formatter={(val: number) => `R$ ${(val/1000).toFixed(1)}k`} fill="#8b5cf6" fontSize={11} fontWeight="bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm pb-10">Nenhuma comissão registrada.</div>}
            </div>
          )}

          {isActive('chart_top') && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80 overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Trophy className="mr-2 text-yellow-500" size={20}/> Top Corretores (VGV)</h3>
                <div className="space-y-4">
                    {topBrokers.map((broker, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-700'}`}>{idx + 1}</div>
                                <div className="flex items-center space-x-2"><img src={broker.avatar || `https://ui-avatars.com/api/?name=${broker.name}`} className="w-8 h-8 rounded-full border border-slate-100" /><span className="text-sm font-medium text-slate-700">{broker.name}</span></div>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(broker.value)}</span>
                        </div>
                    ))}
                    {topBrokers.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Nenhuma venda registrada.</p>}
                </div>
            </div>
          )}
      </div>

      {viewLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 relative">
                  <button onClick={() => setViewLead(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><User size={24} /></div>
                      <div><h3 className="text-lg font-bold text-slate-800">{viewLead.name}</h3><span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{viewLead.status}</span></div>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center space-x-3 text-slate-600"><Mail size={18} className="text-slate-400" /><a href={`mailto:${viewLead.email}`} className="hover:text-blue-600 hover:underline">{viewLead.email || 'Não informado'}</a></div>
                      <div className="flex items-center space-x-3 text-slate-600"><Phone size={18} className="text-slate-400" /><span>{viewLead.phone || 'Não informado'}</span></div>
                      {viewLead.notes && <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-4"><p className="text-xs font-bold text-yellow-800 mb-1 uppercase">Observações</p><p className="text-sm text-yellow-900">{viewLead.notes}</p></div>}
                  </div>
              </div>
          </div>
      )}

      {viewProperty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="relative h-56 bg-slate-200"><img src={viewProperty.images?.[0] || 'https://via.placeholder.com/600'} alt={viewProperty.title} className="w-full h-full object-cover" /><button onClick={() => setViewProperty(null)} className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"><X size={20} /></button><div className="absolute bottom-3 left-3 flex gap-2"><span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">{viewProperty.type}</span><span className="bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded shadow font-mono">#{viewProperty.code}</span></div></div>
                  <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{viewProperty.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center mb-4"><MapPin size={14} className="mr-1"/> {viewProperty.neighborhood}, {viewProperty.city}</p>
                      <div className="flex items-center justify-between text-slate-600 text-sm py-4 border-y border-slate-100 mb-4"><span className="flex items-center"><BedDouble size={16} className="mr-1 text-blue-500"/> {viewProperty.bedrooms}</span><span className="flex items-center"><Bath size={16} className="mr-1 text-blue-500"/> {viewProperty.bathrooms}</span><span className="flex items-center"><Square size={16} className="mr-1 text-blue-500"/> {viewProperty.area}m²</span></div>
                      <p className="text-2xl font-bold text-blue-600 mb-4">{formatCurrency(viewProperty.price)}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
