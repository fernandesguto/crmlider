
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property, CommissionSplit } from '../types';
import { PieChart, DollarSign, Search, AlertCircle, Plus, Trash2, X, Save, User as UserIcon, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export const CommissionManager: React.FC = () => {
    const { properties, users, updateProperty, currentAgency } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [splits, setSplits] = useState<CommissionSplit[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Filtra imóveis vendidos com comissão > 0
    // REMOVIDO: Locações (pois ficam 100% com imobiliária)
    const soldProperties = properties.filter(p => 
        p.status === 'Sold' && 
        (p.commissionValue || 0) > 0 &&
        !p.type.includes('Locação') &&
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.soldAt || '').getTime() - new Date(a.soldAt || '').getTime());

    // --- LÓGICA DOS GRÁFICOS ---
    const getPerformanceData = () => {
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
                            if (split.beneficiaryType === 'Agency') {
                                agencyTotal += split.value;
                            } else {
                                brokerTotal += split.value;
                            }
                        });
                    }
                }
            });

            data.push({ name: monthKey, Imobiliaria: agencyTotal, Corretores: brokerTotal });
        }
        return data;
    };

    const chartData = getPerformanceData();
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const currencyFormatter = (val: number) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : `${val}`;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                    <p className="text-sm font-bold text-slate-800 mb-1 capitalize">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value as number)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    // ----------------------------

    // Abre o modal e inicializa o split se não existir
    const handleOpenDistribution = (property: Property) => {
        setSelectedProperty(property);
        setIsSaving(false);
        
        if (property.commissionDistribution && property.commissionDistribution.length > 0) {
            setSplits([...property.commissionDistribution]);
        } else {
            // Inicializa: 50% Agência e 50% Captador (ou 100% Agência se não tiver captador)
            const initialSplits: CommissionSplit[] = [];
            const commission = property.commissionValue || 0;
            const broker = users.find(u => u.id === property.brokerId);

            if (currentAgency) {
                initialSplits.push({
                    beneficiaryType: 'Agency',
                    beneficiaryId: currentAgency.id,
                    beneficiaryName: currentAgency.name || 'Imobiliária',
                    percentage: broker ? 50 : 100,
                    value: broker ? commission * 0.5 : commission
                });
            }

            if (broker) {
                initialSplits.push({
                    beneficiaryType: 'Broker',
                    beneficiaryId: broker.id,
                    beneficiaryName: broker.name,
                    percentage: 50,
                    value: commission * 0.5
                });
            }

            setSplits(initialSplits);
        }
    };

    const handleUpdateSplit = (index: number, field: 'percentage' | 'value', rawValue: string) => {
        const totalCommission = selectedProperty?.commissionValue || 0;
        if (totalCommission === 0) return;

        const newSplits = [...splits];
        let value = parseFloat(rawValue);
        if (isNaN(value)) value = 0;
        
        if (field === 'percentage') {
            newSplits[index].percentage = value;
            newSplits[index].value = (totalCommission * value) / 100;
        } else {
            newSplits[index].value = value;
            newSplits[index].percentage = (value / totalCommission) * 100;
        }
        setSplits(newSplits);
    };

    const handleAddBroker = (userId: string) => {
        if (!userId || !selectedProperty) return;
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Verifica se já está na lista
        if (splits.some(s => s.beneficiaryId === userId)) {
            alert("Este corretor já está na lista de rateio.");
            return;
        }

        setSplits([...splits, {
            beneficiaryType: 'Broker',
            beneficiaryId: user.id,
            beneficiaryName: user.name,
            percentage: 0,
            value: 0
        }]);
    };

    const handleRemoveSplit = (index: number) => {
        const newSplits = splits.filter((_, i) => i !== index);
        setSplits(newSplits);
    };

    const handleSave = async () => {
        if (!selectedProperty) return;
        
        const totalPercent = splits.reduce((acc, curr) => acc + curr.percentage, 0);
        
        // Validação com margem de erro pequena para ponto flutuante
        if (Math.abs(totalPercent - 100) > 0.5) {
            alert(`A soma das porcentagens deve ser 100%.\n\nSoma atual: ${totalPercent.toFixed(1)}%`);
            return;
        }

        setIsSaving(true);

        try {
            // Garante que os números estão limpos antes de salvar
            const cleanSplits = splits.map(s => ({
                ...s,
                percentage: Number(s.percentage.toFixed(2)),
                value: Number(s.value.toFixed(2))
            }));

            await updateProperty({
                ...selectedProperty,
                commissionDistribution: cleanSplits
            });
            
            // Sucesso
            setSelectedProperty(null);
            alert("Rateio de comissão salvo com sucesso!");
        } catch (e: any) {
            console.error("Erro ao salvar rateio:", e);
            alert(`Erro ao salvar: ${e.message || "Verifique sua conexão ou permissões."}`);
        } finally {
            setIsSaving(false);
        }
    };

    const currentTotalValue = splits.reduce((acc, curr) => acc + curr.value, 0);
    const currentTotalPercent = splits.reduce((acc, curr) => acc + curr.percentage, 0);
    const remainingValue = (selectedProperty?.commissionValue || 0) - currentTotalValue;
    const isValidTotal = Math.abs(currentTotalPercent - 100) < 0.5;

    return (
        <div className="p-8 h-screen overflow-y-auto bg-slate-50">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center">
                    <PieChart className="mr-3 text-blue-600" size={32} />
                    Gestão de Comissões
                </h1>
                <p className="text-slate-500">Distribua as comissões de vendas entre a imobiliária e os corretores.</p>
            </div>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Building2 className="mr-2 text-purple-600" size={20}/> Receita da Imobiliária (Mês)
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Imobiliaria" name="Imobiliária" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                                <LabelList dataKey="Imobiliaria" position="top" formatter={(val: number) => val > 0 ? currencyFormatter(val) : ''} style={{ fill: '#8b5cf6', fontSize: '11px', fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <UserIcon className="mr-2 text-blue-600" size={20}/> Comissões Corretores (Mês)
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Corretores" name="Corretores" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                                <LabelList dataKey="Corretores" position="top" formatter={(val: number) => val > 0 ? currencyFormatter(val) : ''} style={{ fill: '#3b82f6', fontSize: '11px', fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center">
                <Search className="text-slate-400 mr-2" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar venda por imóvel..." 
                    className="flex-1 outline-none text-slate-700 bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {soldProperties.map(property => {
                    const isDistributed = property.commissionDistribution && property.commissionDistribution.length > 0;
                    
                    // Cálculos de distribuição
                    const agencyTotal = property.commissionDistribution?.reduce((acc, item) => item.beneficiaryType === 'Agency' ? acc + item.value : acc, 0) || 0;
                    // Corretores individuais
                    const brokers = property.commissionDistribution?.filter(s => s.beneficiaryType === 'Broker') || [];

                    return (
                        <div key={property.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition">
                            <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDistributed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{property.title}</h3>
                                    <p className="text-sm text-slate-500 font-mono">#{property.code} • Vendido em {new Date(property.soldAt!).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto justify-end">
                                <div className="text-center md:text-right">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Comissão Total</p>
                                    <p className="text-xl font-bold text-slate-800">{formatCurrency(property.commissionValue || 0)}</p>
                                </div>

                                <div className="text-center md:text-right min-w-[140px]">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Distribuição</p>
                                    {isDistributed ? (
                                        <div className="flex flex-col items-center md:items-end text-sm space-y-1">
                                            <span className="font-semibold text-purple-600 flex items-center" title="Imobiliária">
                                                <Building2 size={12} className="mr-1"/> {formatCurrency(agencyTotal)}
                                            </span>
                                            {brokers.map((b, idx) => (
                                                <span key={idx} className="font-medium text-slate-600 flex items-center text-xs">
                                                    <UserIcon size={10} className="mr-1 text-blue-500"/>
                                                    {b.beneficiaryName}: <span className="font-bold ml-1 text-blue-600">{formatCurrency(b.value)}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                            <AlertCircle size={12} className="mr-1" /> Pendente
                                        </span>
                                    )}
                                </div>

                                <button 
                                    onClick={() => handleOpenDistribution(property)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm w-full md:w-auto whitespace-nowrap"
                                >
                                    {isDistributed ? 'Editar Rateio' : 'Distribuir'}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {soldProperties.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        Nenhuma venda com comissão encontrada.
                    </div>
                )}
            </div>

            {/* MODAL DE DISTRIBUIÇÃO */}
            {selectedProperty && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <PieChart className="mr-2" size={24}/> Rateio de Comissão
                                </h2>
                                <p className="text-blue-200 text-sm mt-1">{selectedProperty.title}</p>
                            </div>
                            <button onClick={() => setSelectedProperty(null)} className="text-slate-400 hover:text-white transition"><X size={24}/></button>
                        </div>

                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex justify-between items-center">
                                <span className="font-bold text-blue-800">Valor Total da Comissão</span>
                                <span className="text-2xl font-bold text-blue-700">{formatCurrency(selectedProperty.commissionValue || 0)}</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {splits.map((split, index) => (
                                    <div key={index} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                                        <div className={`p-2 rounded-full flex-shrink-0 ${split.beneficiaryType === 'Agency' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {split.beneficiaryType === 'Agency' ? <Building2 size={20} /> : <UserIcon size={20} />}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{split.beneficiaryName}</p>
                                            <p className="text-xs text-slate-500">{split.beneficiaryType === 'Agency' ? 'Imobiliária' : 'Corretor'}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="relative w-24">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={split.percentage} 
                                                    onChange={(e) => handleUpdateSplit(index, 'percentage', e.target.value)}
                                                    className="w-full pl-2 pr-6 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-right font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-2 top-1.5 text-slate-400 text-sm pointer-events-none">%</span>
                                            </div>
                                            
                                            <div className="relative w-32">
                                                <span className="absolute left-2 top-1.5 text-slate-400 text-sm pointer-events-none">R$</span>
                                                <input 
                                                    type="number"
                                                    step="0.01" 
                                                    value={split.value} 
                                                    onChange={(e) => handleUpdateSplit(index, 'value', e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-right font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                />
                                            </div>

                                            <button 
                                                onClick={() => handleRemoveSplit(index)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                                <div className="relative">
                                    <select 
                                        className="appearance-none bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded-lg font-medium outline-none cursor-pointer transition text-sm w-full sm:w-auto"
                                        onChange={(e) => {
                                            handleAddBroker(e.target.value);
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="">+ Adicionar Corretor</option>
                                        {users.filter(u => !splits.some(s => s.beneficiaryId === u.id)).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <Plus size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-slate-600 mb-1">
                                        Total Distribuído: 
                                        <span className={`ml-1 font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                                            {currentTotalPercent.toFixed(1)}%
                                        </span>
                                    </p>
                                    <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden ml-auto">
                                        <div 
                                            className={`h-full transition-all duration-300 ${isValidTotal ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(currentTotalPercent, 100)}%` }}
                                        />
                                    </div>
                                    {!isValidTotal && (
                                        <p className="text-xs text-red-500 font-bold mt-1 flex items-center justify-end">
                                            <AlertTriangle size={12} className="mr-1"/>
                                            {remainingValue > 0 ? `Falta: ${formatCurrency(remainingValue)}` : `Excedente: ${formatCurrency(Math.abs(remainingValue))}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-200">
                            <button 
                                onClick={() => setSelectedProperty(null)} 
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={!isValidTotal || isSaving}
                                className={`px-6 py-2 text-white font-bold rounded-lg transition flex items-center shadow-sm ${
                                    !isValidTotal 
                                    ? 'bg-slate-300 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className="mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        Salvar Rateio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
