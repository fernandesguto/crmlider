import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Search, MapPin, BedDouble, Bath, Square, ArrowLeft, Send, CheckCircle, Store } from 'lucide-react';
import { PropertyType, LeadStatus, Property, Agency } from '../types';
import * as DB from '../services/db';

export const PublicPage: React.FC = () => {
  const { setCurrentView, addLead } = useApp(); // addLead vem do context, mas precisaremos adaptar a lógica interna dele
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Public Page needs to load its own data to show ALL properties from ALL agencies or filtered
  const [publicProperties, setPublicProperties] = useState<Property[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('ALL');

  // Form State
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Load public data independently from logged user context
  useEffect(() => {
    const loadPublicData = async () => {
       const [allProps, allAgencies] = await Promise.all([
           DB.getAll<Property>('properties'),
           DB.getAll<Agency>('agencies')
       ]);
       setPublicProperties(allProps);
       setAgencies(allAgencies);
    };
    loadPublicData();
  }, []);

  const filteredProperties = publicProperties.filter(p => {
      const typeMatch = filterType === 'ALL' || p.type === filterType;
      const agencyMatch = selectedAgencyId === 'ALL' || p.agencyId === selectedAgencyId;
      return typeMatch && agencyMatch;
  });

  const getAgencyName = (id: string) => agencies.find(a => a.id === id)?.name || 'Imobiliária Parceira';

  const handleInterestClick = (property: Property) => {
    setSelectedProperty(property);
    setSuccessMessage(false);
    setLeadForm({ name: '', email: '', phone: '' });
  };

  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    setIsSubmitting(true);
    try {
      // Passamos o agencyId do imóvel para que o lead caia na caixa de entrada correta
      await addLead({
        id: Date.now().toString(),
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        type: 'Buyer',
        status: LeadStatus.NEW,
        interestedInPropertyIds: [selectedProperty.id],
        notes: `Lead capturado via Site Público para o imóvel: ${selectedProperty.title}`,
        createdAt: new Date().toISOString(),
        agencyId: selectedProperty.agencyId
      });
      setSuccessMessage(true);
      setTimeout(() => {
        setSelectedProperty(null);
      }, 2500);
    } catch (error) {
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="text-blue-500" size={32} />
            <span className="text-2xl font-bold tracking-tight">Portal ImobERP</span>
          </div>
          <button 
             onClick={() => setCurrentView('DASHBOARD')}
             className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center transition border border-slate-700"
          >
            <ArrowLeft size={16} className="mr-1"/>
            Área do Corretor
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-blue-600 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 z-0"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Encontre o imóvel dos seus sonhos</h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Milhares de imóveis das melhores imobiliárias em um só lugar.</p>
          
          <div className="bg-white p-4 rounded-xl shadow-xl grid grid-cols-1 md:grid-cols-12 gap-4 max-w-4xl mx-auto">
             <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por cidade, bairro..." 
                  className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
             
             {/* Agency Filter */}
             <div className="md:col-span-3 relative">
                 <Store className="absolute left-3 top-3.5 text-slate-400" size={18} />
                 <select 
                    value={selectedAgencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                 >
                   <option value="ALL">Todas Imobiliárias</option>
                   {agencies.map(ag => (
                       <option key={ag.id} value={ag.id}>{ag.name}</option>
                   ))}
                 </select>
             </div>

             <div className="md:col-span-2">
                 <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="ALL">Todos Tipos</option>
                   <option value={PropertyType.SALE}>{PropertyType.SALE}</option>
                   <option value={PropertyType.RENTAL_ANNUAL}>Anual</option>
                   <option value={PropertyType.RENTAL_SEASONAL}>Temporada</option>
                 </select>
             </div>

             <div className="md:col-span-2">
                 <button className="w-full bg-blue-600 text-white h-full rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center">
                   Buscar
                 </button>
             </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 border-l-4 border-blue-600 pl-4 flex items-center justify-between">
            <span>Imóveis em Destaque</span>
            {selectedAgencyId !== 'ALL' && (
                <span className="text-sm font-normal bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    Mostrando apenas: {getAgencyName(selectedAgencyId)}
                </span>
            )}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredProperties.map(property => (
             <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
               <div className="h-64 relative group">
                  <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {property.type}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-white text-xs font-medium flex items-center">
                          <Store size={12} className="mr-1" />
                          {getAgencyName(property.agencyId)}
                      </p>
                  </div>
               </div>
               <div className="p-6">
                 <div className="mb-3">
                    <h3 className="font-bold text-xl text-slate-900 line-clamp-1 mb-1">{property.title}</h3>
                    <div className="flex items-center text-slate-500 text-sm">
                      <MapPin size={14} className="mr-1 flex-shrink-0 text-blue-500" />
                      <span className="truncate">{property.address}</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between border-y border-slate-100 py-4 mb-4">
                    <div className="flex flex-col items-center px-2">
                       <BedDouble size={20} className="text-slate-400 mb-1" />
                       <span className="text-sm font-medium text-slate-700">{property.bedrooms} <span className="text-xs text-slate-400 font-normal">Quartos</span></span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col items-center px-2">
                       <Bath size={20} className="text-slate-400 mb-1" />
                       <span className="text-sm font-medium text-slate-700">{property.bathrooms} <span className="text-xs text-slate-400 font-normal">Banheiros</span></span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col items-center px-2">
                       <Square size={20} className="text-slate-400 mb-1" />
                       <span className="text-sm font-medium text-slate-700">{property.area} <span className="text-xs text-slate-400 font-normal">m²</span></span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Valor</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price)}
                        {property.type !== PropertyType.SALE && <span className="text-sm text-slate-500 font-normal">/dia</span>}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleInterestClick(property)}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95 transform"
                    >
                      Tenho Interesse
                    </button>
                 </div>
               </div>
             </div>
           ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
             <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                <Search size={32} className="text-slate-400" />
             </div>
             <h3 className="text-lg font-semibold text-slate-800">Nenhum imóvel encontrado</h3>
             <p className="text-slate-500">Tente ajustar seus filtros de busca.</p>
          </div>
        )}
      </div>

      <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center space-x-2 text-white mb-6">
                 <Building2 size={24} className="text-blue-500" />
                 <span className="text-2xl font-bold">ImobERP</span>
               </div>
               <p className="text-sm leading-relaxed max-w-sm mb-6">
                 O maior portal imobiliário do país. Conectamos as melhores imobiliárias aos clientes que buscam realizar seus sonhos.
               </p>
            </div>
            <div>
               <h4 className="text-white font-bold mb-6 text-lg">Parceiros</h4>
               <ul className="space-y-2 text-sm">
                   {agencies.slice(0, 5).map(ag => (
                       <li key={ag.id} className="hover:text-white cursor-pointer transition">{ag.name}</li>
                   ))}
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-6 text-lg">Contato Portal</h4>
               <ul className="space-y-4 text-sm">
                 <li className="flex items-start space-x-3">
                    <span className="text-blue-500">✉️</span>
                    <span>suporte@imoberp.com.br</span>
                 </li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-800 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} ImobERP. Todos os direitos reservados.
         </div>
      </footer>

      {/* Modal de Interesse */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative h-32">
                <img src={selectedProperty.imageUrl} className="w-full h-full object-cover" alt="Property Header" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{selectedProperty.title}</h3>
                </div>
                <div className="absolute top-4 left-4">
                     <span className="bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-sm">
                         {getAgencyName(selectedProperty.agencyId)}
                     </span>
                </div>
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>
            
            <div className="p-6">
                {!successMessage ? (
                    <>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">Tenho Interesse</h4>
                        <p className="text-slate-500 text-sm mb-6">
                            Seus dados serão enviados diretamente para a imobiliária 
                            <strong> {getAgencyName(selectedProperty.agencyId)}</strong>.
                        </p>
                        
                        <form onSubmit={handleSubmitInterest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nome Completo</label>
                                <input 
                                  required 
                                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  placeholder="Seu nome"
                                  value={leadForm.name}
                                  onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
                                <input 
                                  required 
                                  type="email"
                                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  placeholder="seu@email.com"
                                  value={leadForm.email}
                                  onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Telefone / WhatsApp</label>
                                <input 
                                  required 
                                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  placeholder="(00) 00000-0000"
                                  value={leadForm.phone}
                                  onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                                />
                            </div>
                            
                            <button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center space-x-2 transition disabled:opacity-70"
                            >
                               {isSubmitting ? (
                                   <span>Enviando...</span>
                               ) : (
                                   <>
                                    <Send size={18} />
                                    <span>Enviar Contato</span>
                                   </>
                               )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">Recebemos seu contato!</h4>
                        <p className="text-slate-500">A imobiliária responsável entrará em contato em breve.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};