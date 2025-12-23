
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, DollarSign, Calendar, User, ArrowUpRight, RotateCcw, TrendingUp, X, CheckCircle, AlertTriangle, Clock, PlayCircle, RefreshCw, BarChart3 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Property } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export const Rentals: React.FC = () => {
  const { properties, leads, reactivateProperty, renewRental, financialRecords } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Renew Modal States
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedRenewProp, setSelectedRenewProp] = useState<string | null>(null);
  const [newRentValue, setNewRentValue] = useState<number>(0);
  const [newCommValue, setNewCommValue] = useState<number>(0);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // Filtrar apenas imóveis de Locação que estão "Vendidos" (Locados)
  // E que possuem comissão > 0 (Ou seja, são geridos pela imobiliária)
  const rentedProperties = properties.filter(p => 
    p.type.includes('Locação') && 
    p.status === 'Sold' &&
    (p.commissionValue || 0) > 0
  );

  // --- LÓGICA DE VALORES VIGENTES ---
  // Verifica se o valor cadastrado no imóvel é futuro (reajuste agendado) ou atual
  const getCurrentFinancials = (property: Property) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const start = property.soldAt ? new Date(property.soldAt) : new Date();
      start.setHours(0,0,0,0);

      // Se a data de "venda/reajuste" é no FUTURO
      if (start > today) {
          // Precisamos pegar o valor do contrato ANTERIOR que está no histórico
          // A lógica de reajuste salva o histórico com endDate = data do novo início
          const previousRecord = financialRecords
              .filter(r => r.propertyId === property.id && r.type === 'Rental')
              .sort((a, b) => new Date(b.endDate || '').getTime() - new Date(a.endDate || '').getTime())[0];

          // Se encontrou um registro histórico que termina exatamente quando o novo começa
          if (previousRecord && previousRecord.endDate === property.soldAt) {
               return { rent: previousRecord.value, commission: previousRecord.commission };
          }

          // Se é uma locação nova futura (sem histórico anterior), mostramos o valor futuro
          // para que o dashboard não fique zerado, mas indicamos visualmente na tabela
          return { rent: property.salePrice || 0, commission: property.commissionValue || 0 };
      }

      // Se a data já passou ou é hoje, o valor vigente é o do próprio imóvel
      return { rent: property.salePrice || 0, commission: property.commissionValue || 0 };
  }

  // Métricas calculadas com a função de valores vigentes
  const totalRented = rentedProperties.length;
  
  const monthlyRevenue = rentedProperties.reduce((acc, curr) => acc + getCurrentFinancials(curr).commission, 0);
  const totalContractsValue = rentedProperties.reduce((acc, curr) => acc + getCurrentFinancials(curr).rent, 0);

  // --- LÓGICA DO GRÁFICO (Últimos 12 meses) ---
  const getRentalsChartData = () => {
    const months = 12;
    const data = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
        
        let totalComissaoMes = 0;
        
        // Sum from properties closed in that month
        rentedProperties.forEach(p => {
            if (!p.soldAt) return;
            const soldDate = new Date(p.soldAt);
            if (soldDate >= refDate && soldDate < nextMonth) {
                totalComissaoMes += (p.commissionValue || 0);
            }
        });

        // Sum from historical records (renewal entries)
        financialRecords.forEach(rec => {
            if (rec.type !== 'Rental') return;
            const recDate = new Date(rec.date);
            if (recDate >= refDate && recDate < nextMonth) {
                totalComissaoMes += (rec.commission || 0);
            }
        });
        
        data.push({ name: monthKey, Receita: totalComissaoMes });
    }
    return data;
  };

  const chartData = getRentalsChartData();

  // --- CURRENCY HELPERS ---
  const parseCurrency = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currencyFormatter = (val: number) => val >= 1000 ? `R$ ${(val/1000).toFixed(1)}k` : `R$ ${val}`;

  const getLeadName = (leadId?: string) => {
      if (!leadId) return 'Cliente Externo / Desconhecido';
      const lead = leads.find(l => l.id === leadId);
      return lead ? lead.name : 'Cliente Externo';
  };

  const handleEndContract = (id: string) => {
      setSelectedPropertyId(id);
      setModalOpen(true);
  };

  const confirmEndContract = async () => {
      if (selectedPropertyId) {
          await reactivateProperty(selectedPropertyId);
      }
      setModalOpen(false);
      setSelectedPropertyId(null);
  };

  const handleOpenRenew = (property: Property) => {
      setSelectedRenewProp(property.id);
      setNewRentValue(property.salePrice || 0);
      setNewCommValue(property.commissionValue || 0);
      
      // Sugerir datas: Início = Hoje, Fim = +1 Ano
      const today = new Date().toISOString().split('T')[0];
      setNewStartDate(today);
      
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setNewEndDate(nextYear.toISOString().split('T')[0]);
      
      setRenewModalOpen(true);
  };

  const confirmRenew = async () => {
      if (selectedRenewProp && newRentValue && newCommValue && newStartDate && newEndDate) {
          if (newEndDate <= newStartDate) {
              alert("A data de término deve ser depois do início.");
              return;
          }

          await renewRental(
              selectedRenewProp, 
              newRentValue, 
              newCommValue, 
              newStartDate,
              newEndDate
          );
          setRenewModalOpen(false);
          setSelectedRenewProp(null);
      } else {
          alert('Preencha todos os campos.');
      }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
  );

  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Locações</h1>
        <p className="text-slate-500">Administração de contratos ativos e receitas recorrentes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
            icon={Building2} 
            label="Imóveis Locados (Ativos)" 
            value={totalRented} 
            subtext="Contratos sob gestão"
            color="bg-blue-600" 
        />
        <StatCard 
            icon={DollarSign} 
            label="Receita Mensal (Adm)" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue)} 
            subtext="Comissões recorrentes (Vigentes)"
            color="bg-green-600" 
        />
        <StatCard 
            icon={ArrowUpRight} 
            label="Valor Total em Aluguéis" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalContractsValue)} 
            subtext="Volume financeiro mensal (Vigente)"
            color="bg-purple-600" 
        />
      </div>

      {/* Gráfico de Evolução */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <BarChart3 className="mr-2 text-purple-600" size={20}/> Evolução de Receita de Locação - Últimos 12 Meses
        </h3>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={currencyFormatter} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Bar dataKey="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={50}>
                        <LabelList dataKey="Receita" position="top" formatter={currencyFormatter} fill="#8b5cf6" fontSize={11} fontWeight="bold" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Carteira de Locação</h2>
        </div>
        
        {rentedProperties.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Imóvel</th>
                            <th className="px-6 py-3 font-semibold">Inquilino</th>
                            <th className="px-6 py-3 font-semibold">Início</th>
                            <th className="px-6 py-3 font-semibold">Fim do Contrato</th>
                            <th className="px-6 py-3 font-semibold">Valor Aluguel</th>
                            <th className="px-6 py-3 font-semibold">Comissão (Adm)</th>
                            <th className="px-6 py-3 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rentedProperties.map(property => {
                            const financials = getCurrentFinancials(property);
                            const isFuture = property.soldAt && new Date(property.soldAt) > new Date();
                            const hasHistory = financialRecords.some(r => r.propertyId === property.id && r.type === 'Rental');
                            const isNewContract = isFuture && !hasHistory;
                            const isReadjustment = isFuture && hasHistory;
                            
                            // Lógica de Vencimento (usando rentalEndDate ou soldAt + 1 ano como fallback)
                            const startDate = property.soldAt ? new Date(property.soldAt) : new Date();
                            let endDate = new Date(startDate);
                            endDate.setFullYear(endDate.getFullYear() + 1); // Fallback padrão

                            if (property.rentalEndDate) {
                                endDate = new Date(property.rentalEndDate);
                            }
                            
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            endDate.setHours(0,0,0,0);

                            const diffTime = endDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                            
                            // Alerta se faltar 30 dias ou menos
                            const isExpiring = diffDays <= 30 && diffDays >= 0;
                            const isExpired = diffDays < 0;

                            return (
                                <tr key={property.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                                                <img src={property.images?.[0]} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{property.title}</p>
                                                <p className="text-xs text-slate-500 font-mono">#{property.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-slate-700">
                                            <User size={14} className="mr-2 text-slate-400" />
                                            {getLeadName(property.soldToLeadId)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Calendar size={14} className="mr-2 text-slate-400" />
                                            {startDate.toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex flex-col text-sm ${isExpiring || isExpired ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                            <div className="flex items-center">
                                                {endDate.toLocaleDateString('pt-BR')}
                                            </div>
                                            {isExpiring && (
                                                <span className="text-[10px] flex items-center mt-1 bg-red-50 px-2 py-0.5 rounded border border-red-100 w-fit">
                                                    <AlertTriangle size={10} className="mr-1"/> Vence em {diffDays} dias
                                                </span>
                                            )}
                                            {isExpired && (
                                                <span className="text-[10px] flex items-center mt-1 bg-red-100 px-2 py-0.5 rounded border border-red-200 w-fit">
                                                    <AlertTriangle size={10} className="mr-1"/> Vencido
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.rent)}
                                            </span>
                                            {isReadjustment && (
                                                <span className="text-[10px] text-blue-600 flex items-center" title={`Mudará para ${formatCurrency(property.salePrice || 0)} em ${new Date(property.soldAt!).toLocaleDateString()}`}>
                                                    <Clock size={10} className="mr-1"/> Reajuste em breve
                                                </span>
                                            )}
                                            {isNewContract && (
                                                <span className="text-[10px] text-emerald-600 flex items-center" title={`Contrato começa em ${new Date(property.soldAt!).toLocaleDateString()}`}>
                                                    <PlayCircle size={10} className="mr-1"/> Início em breve
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.commission)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button 
                                                onClick={() => handleOpenRenew(property)}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded transition flex items-center"
                                                title="Renovar Contrato"
                                            >
                                                <RefreshCw size={14} className="mr-1" /> Renovar
                                            </button>
                                            <button 
                                                onClick={() => handleEndContract(property.id)}
                                                className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition flex items-center"
                                                title="Encerrar Contrato"
                                            >
                                                <RotateCcw size={14} className="mr-1" /> Encerrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="p-12 text-center text-slate-400">
                <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-600">Nenhum contrato ativo sob gestão.</p>
                <p className="text-sm">Locações marcadas como "Externas" não aparecem aqui.</p>
            </div>
        )}
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmEndContract}
        title="Encerrar Contrato de Locação"
        message="Ao encerrar o contrato, este imóvel voltará a ficar disponível (Ativo) na lista de imóveis e deixará de gerar receita recorrente neste painel. Tem certeza?"
        confirmText="Sim, Encerrar Contrato"
        isDestructive={false}
      />

      {/* MODAL DE RENOVAÇÃO */}
      {renewModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                  <button onClick={() => setRenewModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <RefreshCw className="mr-2 text-blue-600" size={20}/>
                      Renovar Contrato
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Novo Aluguel (R$)</label>
                          <input 
                              type="text"
                              value={formatCurrency(newRentValue)}
                              onChange={e => setNewRentValue(parseCurrency(e.target.value))}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nova Comissão/Adm (R$)</label>
                          <input 
                              type="text"
                              value={formatCurrency(newCommValue)}
                              onChange={e => setNewCommValue(parseCurrency(e.target.value))}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-semibold text-green-700"
                          />
                      </div>
                      <div className="border-t border-slate-100 pt-4 mt-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Novo Período</label>
                          <div className="space-y-3">
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Início</label>
                                  <input 
                                      type="date" 
                                      value={newStartDate}
                                      onChange={e => setNewStartDate(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Fim</label>
                                  <input 
                                      type="date" 
                                      value={newEndDate}
                                      onChange={e => setNewEndDate(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-2">
                      <button onClick={() => setRenewModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
                      <button onClick={confirmRenew} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm flex items-center">
                          <CheckCircle size={16} className="mr-1.5"/> Salvar Renovação
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
