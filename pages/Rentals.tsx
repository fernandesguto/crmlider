
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, DollarSign, Calendar, User, ArrowUpRight, RotateCcw, TrendingUp, X, CheckCircle } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Rentals: React.FC = () => {
  const { properties, leads, reactivateProperty, readjustRental } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Readjust Modal States
  const [readjustModalOpen, setReadjustModalOpen] = useState(false);
  const [selectedReadjustProp, setSelectedReadjustProp] = useState<string | null>(null);
  const [newRentValue, setNewRentValue] = useState<number>(0);
  const [newCommValue, setNewCommValue] = useState<number>(0);
  const [readjustDate, setReadjustDate] = useState('');

  // Filtrar apenas imóveis de Locação que estão "Vendidos" (Locados)
  // E que possuem comissão > 0 (Ou seja, são geridos pela imobiliária)
  // Locações externas (comissão 0) não aparecem aqui.
  const rentedProperties = properties.filter(p => 
    p.type.includes('Locação') && 
    p.status === 'Sold' &&
    (p.commissionValue || 0) > 0
  );

  // Métricas
  const totalRented = rentedProperties.length;
  
  // Receita Mensal Recorrente (Soma das comissões/taxas de adm)
  const monthlyRevenue = rentedProperties.reduce((acc, curr) => acc + (curr.commissionValue || 0), 0);
  
  // Valor Total de Contratos (Soma dos aluguéis)
  const totalContractsValue = rentedProperties.reduce((acc, curr) => acc + (curr.salePrice || 0), 0);

  // --- CURRENCY HELPERS ---
  const parseCurrency = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

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

  const handleOpenReadjust = (id: string, currentRent: number, currentComm: number) => {
      setSelectedReadjustProp(id);
      setNewRentValue(currentRent);
      setNewCommValue(currentComm);
      const today = new Date().toISOString().split('T')[0];
      setReadjustDate(today);
      setReadjustModalOpen(true);
  };

  const confirmReadjust = async () => {
      if (selectedReadjustProp && newRentValue && newCommValue && readjustDate) {
          await readjustRental(
              selectedReadjustProp, 
              newRentValue, 
              newCommValue, 
              readjustDate
          );
          setReadjustModalOpen(false);
          setSelectedReadjustProp(null);
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
            subtext="Comissões recorrentes"
            color="bg-green-600" 
        />
        <StatCard 
            icon={ArrowUpRight} 
            label="Valor Total em Aluguéis" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalContractsValue)} 
            subtext="Volume financeiro mensal"
            color="bg-purple-600" 
        />
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
                            <th className="px-6 py-3 font-semibold">Valor Aluguel</th>
                            <th className="px-6 py-3 font-semibold">Comissão (Adm)</th>
                            <th className="px-6 py-3 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rentedProperties.map(property => (
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
                                        {property.soldAt ? new Date(property.soldAt).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-700">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.salePrice || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.commissionValue || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button 
                                            onClick={() => handleOpenReadjust(property.id, property.salePrice || 0, property.commissionValue || 0)}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded transition flex items-center"
                                            title="Reajustar Valores"
                                        >
                                            <TrendingUp size={14} className="mr-1" /> Reajustar
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
                        ))}
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

      {/* MODAL DE REAJUSTE */}
      {readjustModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95">
                  <button onClick={() => setReadjustModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <TrendingUp className="mr-2 text-blue-600" size={20}/>
                      Reajustar Valores
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Data do Reajuste</label>
                          <input 
                              type="date" 
                              value={readjustDate}
                              onChange={e => setReadjustDate(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Novo Valor do Aluguel (R$)</label>
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
                  </div>

                  <div className="mt-6 flex justify-end space-x-2">
                      <button onClick={() => setReadjustModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
                      <button onClick={confirmReadjust} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm flex items-center">
                          <CheckCircle size={16} className="mr-1.5"/> Salvar Reajuste
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
