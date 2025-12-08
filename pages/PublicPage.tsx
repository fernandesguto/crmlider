
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, BedDouble, Bath, Square, Phone, Mail, Search, ArrowRight, X, ChevronLeft, ChevronRight, CheckCircle, User, Filter } from 'lucide-react';
import { PropertyType, Property, LeadStatus } from '../types';

export const PublicPage: React.FC = () => {
    const { properties, currentAgency, addLead } = useApp();
    
    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [subtypeFilter, setSubtypeFilter] = useState<string>('');
    const [cityFilter, setCityFilter] = useState<string>('');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [bedroomsFilter, setBedroomsFilter] = useState<string>('');
    const [bathroomsFilter, setBathroomsFilter] = useState<string>('');
    const [featureFilter, setFeatureFilter] = useState('');

    // Modal State
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showInterestForm, setShowInterestForm] = useState(false);
    
    // Lead Form State
    const [leadName, setLeadName] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter properties (Active only)
    const activeProperties = properties.filter(p => p.status === 'Active');

    // Generate dynamic lists based on active properties
    const allCities = Array.from(new Set(activeProperties.map(p => p.city || '').filter(c => c !== ''))).sort();
    const allFeatures = Array.from(new Set(activeProperties.flatMap(p => p.features || []))).sort();

    const filteredProperties = activeProperties.filter(property => {
      const searchLower = searchTerm.toLowerCase();
      const matchText = !searchTerm ||
          property.title.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          (property.neighborhood || '').toLowerCase().includes(searchLower) ||
          (property.city || '').toLowerCase().includes(searchLower) ||
          (property.code?.toString().includes(searchLower));

      const matchType = !typeFilter || property.type === typeFilter;
      const matchCategory = !categoryFilter || property.category === categoryFilter;
      const matchSubtype = !subtypeFilter || property.subtype === subtypeFilter;
      const matchCity = !cityFilter || property.city === cityFilter;
      
      const matchMinPrice = !priceMin || property.price >= Number(priceMin);
      const matchMaxPrice = !priceMax || property.price <= Number(priceMax);
      
      const matchBedrooms = !bedroomsFilter || property.bedrooms >= Number(bedroomsFilter);
      const matchBathrooms = !bathroomsFilter || property.bathrooms >= Number(bathroomsFilter);
      const matchFeature = !featureFilter || (property.features && property.features.includes(featureFilter));

      return matchText && matchType && matchCategory && matchSubtype && matchCity && matchMinPrice && matchMaxPrice && matchBedrooms && matchBathrooms && matchFeature;
    });

    // --- CURRENCY HELPERS ---
    const parseCurrency = (value: string) => {
        return Number(value.replace(/\D/g, "")) / 100;
    };

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    
    const formatPriceDisplay = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(price);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('');
        setCategoryFilter('');
        setSubtypeFilter('');
        setCityFilter('');
        setPriceMin('');
        setPriceMax('');
        setBedroomsFilter('');
        setBathroomsFilter('');
        setFeatureFilter('');
    };

    const handleViewDetails = (property: Property) => {
        setSelectedProperty(property);
        setCurrentImageIndex(0);
        setShowInterestForm(false);
        setFormSuccess(false);
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
    };

    const handleCloseModal = () => {
        setSelectedProperty(null);
    };

    const nextImage = () => {
        if (selectedProperty && selectedProperty.images) {
            setCurrentImageIndex((prev) => (prev + 1) % selectedProperty.images.length);
        }
    };

    const prevImage = () => {
        if (selectedProperty && selectedProperty.images) {
            setCurrentImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length);
        }
    };

    const handleSubmitInterest = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedProperty || !currentAgency) return;
        
        setIsSubmitting(true);

        try {
            await addLead({
                id: Date.now().toString(),
                name: leadName,
                email: leadEmail,
                phone: leadPhone,
                type: 'Buyer',
                status: LeadStatus.NEW,
                interestedInPropertyIds: [selectedProperty.id],
                notes: 'Captado via Site Público',
                createdAt: new Date().toISOString(),
                agencyId: currentAgency.id
            });
            setFormSuccess(true);
            setTimeout(() => {
                handleCloseModal();
            }, 2500);
        } catch (error) {
            alert('Erro ao enviar contato. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleGoBack = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        window.location.search = ''; 
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header / Hero */}
            <header className="bg-slate-100 shadow-sm sticky top-0 z-40 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        {currentAgency?.logoUrl ? (
                            <img src={currentAgency.logoUrl} className="h-12 w-auto object-contain" alt={currentAgency.name} />
                        ) : (
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Building2 size={32} />
                                <span className="text-2xl font-bold tracking-tight">{currentAgency?.name || 'ImobERP'}</span>
                            </div>
                        )}
                    </div>
                    <div>
                         <button onClick={handleGoBack} className="text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition">Voltar ao Sistema</button>
                    </div>
                </div>
            </header>

            {/* Filter Section */}
            <div className="bg-white border-b border-slate-200 py-6 px-6 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center space-x-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider">
                        <Filter size={14} /> <span>Encontre seu Imóvel</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Linha 1 */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input type="text" placeholder="Bairro, Condomínio, Código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cidade</label>
                            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Todas</option>
                                {allCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Negócio</label>
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Todos</option>
                                {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Todas</option>
                                {['Residencial', 'Comercial', 'Terreno / Área', 'Rural', 'Industrial'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Linha 2 */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subtipo</label>
                            <select value={subtypeFilter} onChange={(e) => setSubtypeFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Todos</option>
                                {['Casa', 'Apartamento', 'Sala', 'Loja', 'Prédio', 'Galpão', 'Terreno', 'Chácara'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Mín</label>
                                <input 
                                    type="text" 
                                    placeholder="R$ 0,00" 
                                    value={priceMin ? formatCurrency(Number(priceMin)) : ''} 
                                    onChange={(e) => {
                                        const val = parseCurrency(e.target.value);
                                        setPriceMin(val ? val.toString() : '');
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Máx</label>
                                <input 
                                    type="text" 
                                    placeholder="R$ Max" 
                                    value={priceMax ? formatCurrency(Number(priceMax)) : ''} 
                                    onChange={(e) => {
                                        const val = parseCurrency(e.target.value);
                                        setPriceMax(val ? val.toString() : '');
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quartos</label>
                                <input type="number" min="0" placeholder="Min" value={bedroomsFilter} onChange={(e) => setBedroomsFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Banheiros</label>
                                <input type="number" min="0" placeholder="Min" value={bathroomsFilter} onChange={(e) => setBathroomsFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Diferencial</label>
                            <select value={featureFilter} onChange={(e) => setFeatureFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Todos</option>
                                {allFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>

                    {(searchTerm || priceMin || priceMax || typeFilter || featureFilter || categoryFilter || subtypeFilter || cityFilter || bedroomsFilter || bathroomsFilter) && (
                        <div className="flex justify-end pt-2">
                            <button onClick={clearFilters} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-medium text-sm flex items-center">
                                <X size={14} className="mr-1" /> Limpar Filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Properties Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        Resultados
                        <span className="ml-3 text-sm font-normal text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">{filteredProperties.length} imóveis</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProperties.map(property => (
                        <div key={property.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition duration-300 group cursor-pointer flex flex-col h-full" onClick={() => handleViewDetails(property)}>
                            <div className="h-64 overflow-hidden relative flex-shrink-0">
                                <img
                                    src={property.images?.[0] || 'https://via.placeholder.com/400'}
                                    alt={property.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md uppercase tracking-wider">{property.type}</span>
                                </div>
                                <div className="absolute top-4 right-4 bg-white/90 px-2 py-1 rounded text-xs font-bold font-mono text-slate-800 shadow-sm z-10 whitespace-nowrap">
                                    Cód: {property.code ? property.code.toString().padStart(5, '0') : '---'}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-12">
                                     <p className="text-white font-bold text-lg">{formatPriceDisplay(property.price)}</p>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition">{property.title}</h3>
                                <p className="text-slate-500 text-sm mb-4 flex items-center">
                                    <MapPin size={14} className="mr-1 text-slate-400 flex-shrink-0"/>
                                    <span className="truncate">{property.neighborhood}, {property.city} - {property.state}</span>
                                </p>

                                <div className="flex items-center justify-between py-4 border-t border-slate-100 text-slate-600 text-sm mt-auto">
                                    <span className="flex items-center" title="Quartos"><BedDouble size={16} className="mr-1.5 text-blue-500"/> {property.bedrooms}</span>
                                    <span className="flex items-center" title="Banheiros"><Bath size={16} className="mr-1.5 text-blue-500"/> {property.bathrooms}</span>
                                    <span className="flex items-center" title="Área"><Square size={16} className="mr-1.5 text-blue-500"/> {property.area}m²</span>
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleViewDetails(property); }}
                                    className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center shadow-sm"
                                >
                                    Ver Detalhes <ArrowRight size={16} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                 {filteredProperties.length === 0 && (
                     <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                         <p className="text-slate-400">Nenhum imóvel encontrado com estes filtros.</p>
                     </div>
                 )}
            </div>

            {/* Footer */}
            <footer className="bg-white text-slate-600 py-12 px-6 border-t border-slate-200">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div>
                        <div className="flex items-center space-x-2 text-slate-900 mb-4">
                            {currentAgency?.logoUrl ? (
                                <img src={currentAgency.logoUrl} className="h-10 w-auto object-contain" alt={currentAgency.name} />
                            ) : (
                                <div className="flex items-center space-x-2 text-slate-800">
                                    <Building2 size={24} />
                                    <span className="text-xl font-bold">{currentAgency?.name || 'ImobERP'}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs text-slate-500">
                            Encontre o lar ideal ou invista com segurança.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-slate-900 font-bold mb-4">Contato</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center"><Mail size={16} className="mr-2 text-blue-600"/> contato@imobiliaria.com.br</li>
                            {currentAgency?.phone && (
                                <li className="flex items-center"><Phone size={16} className="mr-2 text-blue-600"/> {currentAgency.phone}</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-900 font-bold mb-4">Localização</h4>
                        <p className="text-sm flex items-start">
                            {currentAgency?.address ? (
                                <>
                                    <MapPin size={16} className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                                    <span>{currentAgency.address}</span>
                                </>
                            ) : (
                                "Atendemos em toda a região."
                            )}
                        </p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} {currentAgency?.name}. Todos os direitos reservados.
                </div>
            </footer>

            {/* MODAL DE DETALHES */}
            {selectedProperty && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
                        <button 
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-slate-600 rounded-full p-2 transition"
                        >
                            <X size={24} />
                        </button>

                        {/* Coluna Esquerda: Fotos */}
                        <div className="w-full md:w-1/2 bg-slate-100 relative group flex flex-col">
                            <div className="flex-1 relative overflow-hidden bg-black">
                                <img 
                                    src={selectedProperty.images?.[currentImageIndex] || 'https://via.placeholder.com/800'} 
                                    className="w-full h-full object-contain"
                                    alt={selectedProperty.title}
                                />
                                {selectedProperty.images && selectedProperty.images.length > 1 && (
                                    <>
                                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition"><ChevronLeft size={24}/></button>
                                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition"><ChevronRight size={24}/></button>
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">{currentImageIndex + 1} / {selectedProperty.images.length}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Coluna Direita: Informações */}
                        <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-white flex flex-col">
                            {!showInterestForm ? (
                                <>
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">{selectedProperty.type}</span>
                                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">{selectedProperty.subtype}</span>
                                            <span className="text-slate-400 text-xs font-mono ml-auto">Cód: {selectedProperty.code}</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{selectedProperty.title}</h2>
                                        <p className="text-3xl font-bold text-blue-600 mb-4">{formatPriceDisplay(selectedProperty.price)}</p>
                                        
                                        <div className="flex items-center text-slate-600 text-sm mb-6">
                                            <MapPin size={16} className="mr-1 text-slate-400" />
                                            {selectedProperty.address} - {selectedProperty.neighborhood}, {selectedProperty.city}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100 mb-6">
                                            <div className="text-center">
                                                <BedDouble size={20} className="mx-auto mb-1 text-blue-500" />
                                                <span className="block font-bold text-slate-800">{selectedProperty.bedrooms}</span>
                                                <span className="text-xs text-slate-500">Quartos</span>
                                            </div>
                                            <div className="text-center">
                                                <Bath size={20} className="mx-auto mb-1 text-blue-500" />
                                                <span className="block font-bold text-slate-800">{selectedProperty.bathrooms}</span>
                                                <span className="text-xs text-slate-500">Banheiros</span>
                                            </div>
                                            <div className="text-center">
                                                <Square size={20} className="mx-auto mb-1 text-blue-500" />
                                                <span className="block font-bold text-slate-800">{selectedProperty.area}</span>
                                                <span className="text-xs text-slate-500">m² Área</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <h3 className="font-bold text-slate-900 mb-2">Sobre o Imóvel</h3>
                                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedProperty.description}</p>
                                            </div>
                                            {selectedProperty.features && selectedProperty.features.length > 0 && (
                                                <div>
                                                    <h3 className="font-bold text-slate-900 mb-2">Diferenciais</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedProperty.features.map(feat => (
                                                            <span key={feat} className="bg-slate-50 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">{feat}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <button 
                                            onClick={() => setShowInterestForm(true)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 transition transform hover:scale-[1.02] flex items-center justify-center text-lg"
                                        >
                                            <Phone size={20} className="mr-2" />
                                            Tenho Interesse
                                        </button>
                                        <p className="text-center text-xs text-slate-400 mt-2">Fale com um corretor agora mesmo.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <button onClick={() => setShowInterestForm(false)} className="text-slate-500 hover:text-slate-800 text-sm flex items-center mb-6">
                                        <ArrowRight size={16} className="mr-1 rotate-180" /> Voltar aos detalhes
                                    </button>

                                    {formSuccess ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                                <CheckCircle size={40} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Sucesso!</h3>
                                            <p className="text-slate-600 mb-6">Recebemos seu contato. Em breve um de nossos corretores entrará em contato.</p>
                                            <button onClick={handleCloseModal} className="text-blue-600 font-bold hover:underline">Fechar Janela</button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right duration-300">
                                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Gostou deste imóvel?</h3>
                                            <p className="text-slate-600 mb-8">Preencha seus dados abaixo para receber mais informações.</p>

                                            <form onSubmit={handleSubmitInterest} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Seu Nome</label>
                                                    <div className="relative">
                                                        <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                                        <input required value={leadName} onChange={e => setLeadName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Como podemos te chamar?" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Seu Email <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                                    <div className="relative">
                                                        <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                                        <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="seu@email.com" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Seu Telefone / WhatsApp</label>
                                                    <div className="relative">
                                                        <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                                        <input required value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="(00) 00000-0000" />
                                                    </div>
                                                </div>

                                                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-6 transition disabled:opacity-70">
                                                    {isSubmitting ? 'Enviando...' : 'Enviar Contato'}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
