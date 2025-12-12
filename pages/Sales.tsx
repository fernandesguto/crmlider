
import React from 'react';
import { useApp } from '../context/AppContext';
import { DollarSign, TrendingUp, Calendar, User, ShoppingBag, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export const Sales: React.FC = () => {
  const { properties, leads, users } = useApp();

  // Filtra apenas vendas fechadas (Status Sold e Tipo NÃO é Locação)
  // E remove vendas externas (aquelas onde o salePrice é 0 ou não existe)
  const soldProperties = properties.filter(p => 
    p.status === 'Sold' && 
    !p.type.includes('Locação') &&
    (p.salePrice || 0) > 0
  ).sort((a, b) => new Date(b.soldAt || '').getTime() - new Date(a.soldAt || '').getTime());

  // Métricas Gerais
  const totalSold = soldProperties.length;
  const totalSalesValue = soldProperties.reduce((acc, curr) => acc + (curr.salePrice || 0), 0);
  const totalCommission = soldProperties.reduce((acc, curr) => acc + (curr.commissionValue || 0), 0);

  // Dados para o Gráfico (Últimos 12 meses)
  const getSalesChartData = () => {
      const months = 12;
      const data = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
          const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = refDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
          const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
          
          let totalMes = 0;
          
          soldProperties.forEach(p => {
              if (!p.soldAt) return;
              const soldDate = new Date(p.soldAt);
              if (soldDate >= refDate && soldDate < nextMonth) {
                  totalMes += (p.salePrice || 0);
              }
          });
          
          data.push({ name: monthKey, Valor: totalMes });
      }
      return data;
  };

  const chartData = getSalesChartData();

  // Helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const currencyFormatter = (val: number) => val >= 1000000 ? `R$ ${(val/1000000).toFixed(1)}M` : val >= 1000 ? `R$ ${(val/1000).toFixed(0)}k` : `R$ ${val}`;

  const getBrokerName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';
  const getLeadName = (id?: string) => {
      if (!id) return 'Venda Externa';
      return leads.find(l => l.id === id)?.name || 'Cliente Removido';
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
    <div className="p-8 h-screen overflow-y-auto bg-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendas Realizadas</h1>
        <p className="text-slate-500">Histórico de fechamentos e performance comercial (Apenas vendas internas).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
            icon={ShoppingBag} 
            label="Total de Vendas" 
            value={totalSold} 
            subtext="Imóveis vendidos"
            color="bg-blue-600" 
        />
        <StatCard 
            icon={TrendingUp} 
            label="VGV Total (Últimos 12 meses)" 
            value={formatCurrency(totalSalesValue)} 
            subtext="Valor Geral de Vendas"
            color="bg-green-600" 
        />
        <StatCard 
            icon={DollarSign} 
            label="Comissões Geradas" 
            value={formatCurrency(totalCommission)} 
            subtext="Receita da Imobiliária"
            color="bg-purple-600" 
        />
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <BarChart3 className="mr-2 text-green-600" size={20}/> Evolução de Vendas (VGV) - Últimos 12 Meses
        </h3>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={currencyFormatter} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Bar dataKey="Valor" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50}>
                        <LabelList dataKey="Valor" position="top" formatter={currencyFormatter} fill="#10b981" fontSize={11} fontWeight="bold" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Histórico de Fechamentos</h2>
        </div>
        
        {soldProperties.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Imóvel</th>
                            <th className="px-6 py-3 font-semibold">Data Venda</th>
                            <th className="px-6 py-3 font-semibold">Comprador</th>
                            <th className="px-6 py-3 font-semibold">Vendedor</th>
                            <th className="px-6 py-3 font-semibold">Valor Venda</th>
                            <th className="px-6 py-3 font-semibold">Comissão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {soldProperties.map(property => (
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
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Calendar size={14} className="mr-2 text-slate-400" />
                                        {property.soldAt ? new Date(property.soldAt).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-slate-700">
                                        <User size={14} className="mr-2 text-slate-400" />
                                        {getLeadName(property.soldToLeadId)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {getBrokerName(property.soldByUserId || property.brokerId)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-700">
                                        {formatCurrency(property.salePrice || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                        {formatCurrency(property.commissionValue || 0)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="p-12 text-center text-slate-400">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-600">Nenhuma venda interna registrada.</p>
                <p className="text-sm">Vendas de "Outra Imobiliária" (sem valor financeiro) não aparecem aqui.</p>
            </div>
        )}
      </div>
    </div>
  );
};
