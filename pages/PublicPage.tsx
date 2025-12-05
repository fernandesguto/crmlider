import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Search, MapPin, BedDouble, Bath, Square, ArrowLeft } from 'lucide-react';
import { PropertyType } from '../types';

export const PublicPage: React.FC = () => {
  const { properties, setCurrentView } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredProperties = filterType === 'ALL' 
    ? properties 
    : properties.filter(p => p.type === filterType);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="text-blue-500" size={32} />
            <span className="text-2xl font-bold tracking-tight">ImobERP</span>
          </div>
          <button 
             onClick={() => setCurrentView('DASHBOARD')}
             className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center transition"
          >
            <ArrowLeft size={16} className="mr-1"/>
            Área do Corretor
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-blue-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Encontre o imóvel dos seus sonhos</h1>
          <p className="text-xl text-blue-100 mb-10">Venda, aluguel anual ou temporada. Temos a opção perfeita para você.</p>
          
          <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por cidade, bairro..." 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
             <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-48 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 outline-none"
             >
               <option value="ALL">Todos os Tipos</option>
               <option value={PropertyType.SALE}>{PropertyType.SALE}</option>
               <option value={PropertyType.RENTAL_ANNUAL}>{PropertyType.RENTAL_ANNUAL}</option>
               <option value={PropertyType.RENTAL_SEASONAL}>{PropertyType.RENTAL_SEASONAL}</option>
             </select>
             <button className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
               Buscar
             </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-800 mb-8">Destaques</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredProperties.map(property => (
             <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
               <div className="h-64 relative group">
                  <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {property.type}
                  </div>
               </div>
               <div className="p-6">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-slate-900 line-clamp-1">{property.title}</h3>
                 </div>
                 <div className="flex items-center text-slate-500 mb-4">
                    <MapPin size={16} className="mr-1 flex-shrink-0" />
                    <span className="truncate text-sm">{property.address}</span>
                 </div>
                 
                 <div className="flex items-center justify-between border-y border-slate-100 py-4 mb-4">
                    <div className="flex flex-col items-center">
                       <BedDouble size={20} className="text-slate-400 mb-1" />
                       <span className="text-sm font-medium text-slate-700">{property.bedrooms} Quartos</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col items-center">
                       <Bath size={20} className="text-slate-400 mb-1" />
                       <span className="text-sm font-medium text-slate-700">{property.bathrooms} Banheiros</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col items-center">
                       <Square size={20} className="text-slate-400 mb-1" />
                       <span className="text-sm font-medium text-slate-700">{property.area} m²</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Valor</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                        {property.type !== PropertyType.SALE && <span className="text-sm text-slate-500 font-normal"> /período</span>}
                      </p>
                    </div>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition">
                      Ver Detalhes
                    </button>
                 </div>
               </div>
             </div>
           ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-20">
             <p className="text-slate-500 text-lg">Nenhum imóvel encontrado com estes filtros.</p>
          </div>
        )}
      </div>

      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
               <div className="flex items-center space-x-2 text-white mb-4">
                 <Building2 size={24} />
                 <span className="text-xl font-bold">ImobERP</span>
               </div>
               <p className="text-sm">Seu parceiro de confiança para encontrar o lar ideal ou investir com segurança.</p>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Contato</h4>
               <p className="text-sm mb-2">contato@imoberp.com.br</p>
               <p className="text-sm">(11) 99999-9999</p>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Endereço</h4>
               <p className="text-sm">Av. Paulista, 1000 - São Paulo, SP</p>
            </div>
         </div>
      </footer>
    </div>
  );
};
