import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, BedDouble, Bath, Square, Phone, Mail, Search, ArrowRight, X, ChevronLeft, ChevronRight, CheckCircle, User, Filter, ArrowUpDown, MessageCircle, ArrowLeft } from 'lucide-react';
import { PropertyType, Property, LeadStatus } from '../types';

export const PublicPage: React.FC = () => {
    const { properties, publicAgency, currentAgency, addLead, users } = useApp();
    
    // Prioriza a agência pública (da URL) ou a atual (do logado, para preview)
    const agency = publicAgency || currentAgency;

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
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState('date_desc'); 

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showInterestForm, setShowInterestForm] = useState(false);
    
    // --- LIGHTBOX STATE ---
    const [lightboxOpen, setLightboxOpen] = useState(false);
    
    const [leadName, setLeadName] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (lightboxOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [lightboxOpen]);

    // Scroll para o topo quando selecionar um imóvel
    useEffect(() => {
        if (selectedProperty) {
            window.scrollTo(0, 0);
        }
    }, [selectedProperty]);

    // Reset paginação quando filtros mudam
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, categoryFilter, subtypeFilter, cityFilter, priceMin, priceMax, bedroomsFilter, bathroomsFilter, selectedFeatures, sortOption, itemsPerPage]);

    // Atalhos de teclado para Lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, selectedProperty, currentImageIndex]);

    const activeProperties = properties.filter(p => p.status === 'Active');
    const allCities = Array.from(new Set(activeProperties.map(p => p.city || '').filter(c => c !== ''))).sort();
    const allFeatures = Array.from(new Set(activeProperties.flatMap(p => p.features || []))).sort();

    const filteredProperties = activeProperties
      .filter(property => {
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
        
        const matchFeature = selectedFeatures.length === 0 || 
            selectedFeatures.every(f => property.features && property.features.includes(f));

        return matchText && matchType && matchCategory && matchSubtype && matchCity && matchMinPrice && matchMaxPrice && matchBedrooms && matchBathrooms && matchFeature;
      })
      .sort((a, b) => {
          switch (sortOption) {
              case 'price_asc': return a.price - b.price;
              case 'price_desc': return b.price - a.price;
              case 'date_asc': return (Number(a.id) || 0) - (Number(b.id) || 0);
              case 'date_desc':
              default: return (Number(b.id) || 0) - (Number(a.id) || 0);
          }
      });

    // Lógica de Paginação
    const totalItems = filteredProperties.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedProperties = filteredProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const parseCurrency = (value: string) => Number(value.replace(/\D/g, "")) / 100;
    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    
    const formatPriceDisplay = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

    const clearFilters = () => {
        setSearchTerm(''); setTypeFilter(''); setCategoryFilter(''); setSubtypeFilter(''); setCityFilter(''); setPriceMin(''); setPriceMax(''); setBedroomsFilter(''); setBathroomsFilter(''); setSelectedFeatures([]); setSortOption('date_desc');
    };

    const addFeatureFilter = (feature: string) => { if (feature && !selectedFeatures.includes(feature)) setSelectedFeatures([...selectedFeatures, feature]); };
    const removeFeatureFilter = (feature: string) => setSelectedFeatures(selectedFeatures.filter(f => f !== feature));

    const handleViewDetails = (property: Property) => {
        setSelectedProperty(property); setCurrentImageIndex(0); setShowInterestForm(false); setFormSuccess(false); setLeadName(''); setLeadEmail(''); setLeadPhone('');
    };

    const handleBackToList = () => {
        setSelectedProperty(null);
        setLightboxOpen(false);
        window.scrollTo(0, 0);
    };

    const nextImage = (e?: React.MouseEvent) => { 
        e?.stopPropagation();
        if (selectedProperty?.images) setCurrentImageIndex((prev) => (prev + 1) % selectedProperty.images.length); 
    };
    const prevImage = (e?: React.MouseEvent) => { 
        e?.stopPropagation();
        if (selectedProperty?.images) setCurrentImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length); 
    };

    const handleSubmitInterest = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedProperty || !agency) return;
        setIsSubmitting(true);
        try {
            await addLead({
                id: Date.now().toString(), name: leadName, email: leadEmail, phone: leadPhone, type: 'Buyer', status: LeadStatus.NEW, source: 'Site', interestedInPropertyIds: [selectedProperty.id],
                interests: [{ propertyId: selectedProperty.id, status: LeadStatus.NEW, updatedAt: new Date().toISOString() }],
                notes: 'Captado via Site Público', createdAt: new Date().toISOString(), agencyId: agency.id
            });
            setFormSuccess(true);
            setTimeout(() => { handleBackToList(); }, 2500);
        } catch (error) {
            alert('Erro ao enviar contato. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const Watermark = ({ sizeClasses = "max-w-[150px] opacity-30" }: { sizeClasses?: string }) => {
        if (!agency?.logoUrl) return null;
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 p-4">
                <img src={agency.logoUrl} alt="" className={`${sizeClasses} h-auto object-contain pointer-events-none`}/>
            </div>
        );
    };

    const getWhatsAppLink = () => {
        if (!agency?.phone) return '#';
        const phone = agency.phone.replace(/\D/g, '');
        return `https://wa.me/55${phone}?text=${encodeURIComponent('Olá, vi seu site e gostaria de mais informações sobre os imóveis.')}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        {agency?.logoUrl ? (
                            <img src={agency.logoUrl} className="h-12 md:h-16 w-auto object-contain" alt={agency.name} />
                        ) : (
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Building2 size={28} />
                                <span className="text-xl md:text-2xl font-bold tracking-tight">{agency?.name || 'ImobERP'}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        {agency?.phone && (
                            <a 
                                href={getWhatsAppLink()} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-black flex items-center shadow-lg shadow-green-500/20 transition-all transform hover:scale-105"
                            >
                                <MessageCircle size={18} className="mr-1.5 md:mr-2" />
                                WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {!selectedProperty ? (
                    <>
                        <div className="bg-white border-b border-slate-200 py-6 px-4 md:px-6 shadow-sm">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center space-x-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                    <Filter size={14} /> <span>Encontre seu Imóvel</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                            <input type="text" placeholder="Bairro, Código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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
                                            <option value="">Todas</option>
                                            {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                            <option value="">Todas</option>
                                            {['Residencial', 'Comercial', 'Industrial'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

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
                                            <input type="text" placeholder="R$ 0" value={priceMin ? formatCurrency(Number(priceMin)) : ''} onChange={(e) => { const val = parseCurrency(e.target.value); setPriceMin(val ? val.toString() : ''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Máx</label>
                                            <input type="text" placeholder="R$ Max" value={priceMax ? formatCurrency(Number(priceMax)) : ''} onChange={(e) => { const val = parseCurrency(e.target.value); setPriceMax(val ? val.toString() : ''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Diferenciais (Múltiplos)</label>
                                        <select 
                                            onChange={(e) => { addFeatureFilter(e.target.value); e.target.value = ""; }}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="">+ Adicionar filtro...</option>
                                            {allFeatures.filter(f => !selectedFeatures.includes(f)).map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ordenar Por</label>
                                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                                            <option value="date_desc">Mais Recentes</option>
                                            <option value="date_asc">Mais Antigos</option>
                                            <option value="price_asc">Menor Preço</option>
                                            <option value="price_desc">Maior Preço</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Imóveis por Página</label>
                                        <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                                            <option value={20}>20 por página</option>
                                            <option value={50}>50 por página</option>
                                            <option value={100}>100 por página</option>
                                        </select>
                                    </div>
                                </div>

                                {selectedFeatures.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4 px-1">
                                        {selectedFeatures.map(feat => (
                                            <span key={feat} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center font-medium border border-blue-200">
                                                {feat} <button onClick={() => removeFeatureFilter(feat)} className="ml-2 hover:text-red-500"><X size={12}/></button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {(searchTerm || priceMin || priceMax || typeFilter || selectedFeatures.length > 0 || categoryFilter || subtypeFilter || cityFilter || bedroomsFilter || bathroomsFilter) && (
                                    <div className="flex justify-end pt-2">
                                        <button onClick={clearFilters} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-medium text-sm flex items-center">
                                            <X size={14} className="mr-1" /> Limpar Filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                                    Imóveis Disponíveis
                                    <span className="ml-3 text-xs font-normal text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">{totalItems} resultados</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {paginatedProperties.map(property => (
                                    <div key={property.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition duration-300 group cursor-pointer flex flex-col h-full" onClick={() => handleViewDetails(property)}>
                                        <div className="h-56 md:h-64 overflow-hidden relative flex-shrink-0">
                                            <img src={property.images?.[0] || 'https://via.placeholder.com/400'} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <Watermark sizeClasses="max-w-[100px] opacity-25" />
                                            <div className="absolute top-4 left-4 z-20"><span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-md uppercase tracking-wider">{property.type}</span></div>
                                            <div className="absolute top-4 right-4 bg-white/90 px-2 py-1 rounded text-[10px] font-bold font-mono text-slate-800 shadow-sm z-20 whitespace-nowrap">Cód: {property.code ? property.code.toString().padStart(5, '0') : '---'}</div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6 pt-12 z-20"><p className="text-white font-extrabold text-xl md:text-2xl tracking-tight drop-shadow-lg">{formatPriceDisplay(property.price)}</p></div>
                                        </div>
                                        <div className="p-4 md:p-6 flex flex-col flex-1">
                                            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition">{property.title}</h3>
                                            <p className="text-slate-500 text-xs md:text-sm mb-4 flex items-center"><MapPin size={14} className="mr-1 text-slate-400 flex-shrink-0"/><span className="truncate">{property.neighborhood}, {property.city}</span></p>
                                            <div className="flex items-center justify-between py-4 border-t border-slate-100 text-slate-600 text-xs md:text-sm mt-auto">
                                                <span className="flex items-center" title="Quartos"><BedDouble size={16} className="mr-1.5 text-blue-500"/> {property.bedrooms}</span>
                                                <span className="flex items-center" title="Banheiros"><Bath size={16} className="mr-1.5 text-blue-500"/> {property.bathrooms}</span>
                                                <span className="flex items-center" title="Área"><Square size={16} className="mr-1.5 text-blue-500"/> {property.area}m²</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleViewDetails(property); }} className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center shadow-sm text-sm">Ver Detalhes <ArrowRight size={16} className="ml-2" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {totalItems === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-400">Nenhum imóvel encontrado com estes filtros.</p>
                                </div>
                            )}

                            {/* PAGINATION NAVIGATION */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex flex-col items-center justify-center space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-10 h-10 rounded-lg font-bold transition ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>

                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Página {currentPage} de {totalPages}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-white min-h-screen animate-in fade-in duration-300 flex flex-col">
                        <div className="max-w-7xl mx-auto w-full px-4 py-6">
                            <button onClick={handleBackToList} className="flex items-center text-slate-500 hover:text-blue-600 font-bold transition text-sm">
                                <ArrowLeft size={20} className="mr-2" /> Voltar para a lista
                            </button>
                        </div>

                        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row pb-20">
                            <div className="flex-1 min-w-0 px-4 md:px-8">
                                <div className="mb-6">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{selectedProperty.type}</span>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{selectedProperty.subtype}</span>
                                        <span className="text-slate-400 text-xs font-mono ml-auto">Cód: {selectedProperty.code}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-2">{selectedProperty.title}</h2>
                                    <p className="text-3xl md:text-5xl font-black text-blue-600 mb-4 tracking-tight">{formatPriceDisplay(selectedProperty.price)}</p>
                                    <div className="flex items-center text-slate-600 text-sm md:text-base mb-8">
                                        <MapPin size={18} className="mr-1.5 text-slate-400" />
                                        {selectedProperty.neighborhood}, {selectedProperty.city} - {selectedProperty.state}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 md:gap-6 py-6 border-y border-slate-100 mb-8">
                                        <div className="text-center">
                                            <BedDouble size={24} className="mx-auto mb-2 text-blue-500" />
                                            <span className="block font-bold text-slate-800 text-lg">{selectedProperty.bedrooms}</span>
                                            <span className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">Quartos</span>
                                        </div>
                                        <div className="text-center">
                                            <Bath size={24} className="mx-auto mb-2 text-blue-500" />
                                            <span className="block font-bold text-slate-800 text-lg">{selectedProperty.bathrooms}</span>
                                            <span className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">Banheiros</span>
                                        </div>
                                        <div className="text-center">
                                            <Square size={24} className="mx-auto mb-2 text-blue-500" />
                                            <span className="block font-bold text-slate-800 text-lg">{selectedProperty.area}</span>
                                            <span className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">m² Área</span>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div 
                                            onClick={() => setLightboxOpen(true)}
                                            className="relative group overflow-hidden rounded-2xl bg-slate-100 aspect-video md:aspect-[16/9] w-full cursor-pointer"
                                        >
                                            <img src={selectedProperty.images?.[currentImageIndex] || 'https://via.placeholder.com/800'} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt={selectedProperty.title} />
                                            <Watermark sizeClasses="max-w-[200px] md:max-w-[350px] opacity-35" />
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="bg-white/80 text-slate-800 px-4 py-2 rounded-full font-bold shadow-lg text-sm flex items-center"><Search className="mr-2" size={16}/> Ampliar Foto</span>
                                            </div>
                                            {selectedProperty.images && selectedProperty.images.length > 1 && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition z-20"><ChevronLeft size={28}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition z-20"><ChevronRight size={28}/></button>
                                                    <div className="absolute bottom-6 left-0 right-0 text-center z-20"><span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full font-bold">{currentImageIndex + 1} / {selectedProperty.images.length}</span></div>
                                                </>
                                            )}
                                        </div>

                                        {/* Galeria de Miniaturas - Corrigido para não esticar */}
                                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300">
                                            {selectedProperty.images?.map((img, idx) => (
                                                <button 
                                                    key={idx} 
                                                    onClick={() => { setCurrentImageIndex(idx); setLightboxOpen(true); }} 
                                                    className={`w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 border-4 transition-all duration-300 ${currentImageIndex === idx ? 'border-blue-600 scale-95 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                                >
                                                    <img src={img} className="w-full h-full object-cover flex-shrink-0" alt="" />
                                                </button>
                                            ))}
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                                                <div className="w-1.5 h-6 bg-blue-600 mr-3 rounded-full"></div>
                                                Sobre o Imóvel
                                            </h3>
                                            <p className="text-slate-600 text-sm md:text-lg leading-relaxed whitespace-pre-line">{selectedProperty.description}</p>
                                        </div>

                                        {selectedProperty.features && selectedProperty.features.length > 0 && (
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-4">Características e Lazer</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {selectedProperty.features.map(feat => (
                                                        <div key={feat} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                                            <CheckCircle size={16} className="text-blue-500" />
                                                            <span className="text-slate-700 font-medium text-sm md:text-base">{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-[450px] p-4 md:p-8 lg:border-l lg:border-slate-200 bg-white sticky top-[100px] h-fit">
                                {!showInterestForm ? (
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Gostou deste imóvel?</h3>
                                        <p className="text-slate-500 text-sm mb-6">Fale agora com um corretor para tirar suas dúvidas ou agendar uma visita.</p>
                                        <button onClick={() => setShowInterestForm(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition transform hover:scale-[1.02] flex items-center justify-center text-lg mb-4">
                                            Tenho Interesse
                                        </button>
                                        {agency?.phone && (
                                            <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition transform hover:scale-[1.02] flex items-center justify-center text-lg">
                                                <MessageCircle size={24} className="mr-2" /> WhatsApp Direto
                                            </a>
                                        )}
                                        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Atendimento personalizado {agency?.name}</p>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-xl animate-in slide-in-from-right duration-300">
                                        <button onClick={() => setShowInterestForm(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold flex items-center mb-6">
                                            <ArrowLeft size={16} className="mr-1" /> Voltar
                                        </button>
                                        {formSuccess ? (
                                            <div className="flex flex-col items-center justify-center text-center py-10">
                                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 mb-2">Sucesso!</h3>
                                                <p className="text-slate-600 text-sm mb-6">Em breve um de nossos corretores entrará em contato com você.</p>
                                                <button onClick={handleBackToList} className="text-blue-600 font-bold hover:underline">Ir para outros imóveis</button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-black text-slate-900 mb-2">Quase lá!</h3>
                                                <p className="text-slate-600 text-sm mb-6">Preencha os campos para receber o atendimento.</p>
                                                <form onSubmit={handleSubmitInterest} className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Seu Nome</label>
                                                        <div className="relative">
                                                            <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                                            <input required value={leadName} onChange={e => setLeadName(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" placeholder="Ex: Maria Silva" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">WhatsApp / Celular</label>
                                                        <div className="relative">
                                                            <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                                            <input required value={leadPhone} onChange={e => { let val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2'); setLeadPhone(val); }} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" placeholder="(00) 00000-0000" maxLength={15} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Email (Opcional)</label>
                                                        <div className="relative">
                                                            <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                                            <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" placeholder="seu@email.com" />
                                                        </div>
                                                    </div>
                                                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg mt-6 transition disabled:opacity-70 flex items-center justify-center">
                                                        {isSubmitting ? 'Enviando...' : 'Enviar Contato'}
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* LIGHTBOX COMPONENT - TELA TODA COM BOTÕES DE NAVEGAÇÃO E FECHAR - FUNDO PRETO ABSOLUTO */}
            {lightboxOpen && selectedProperty && (
                <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden">
                    {/* Botão Fechar */}
                    <button 
                        onClick={() => setLightboxOpen(false)} 
                        className="absolute top-6 right-6 text-white hover:text-slate-300 transition-all hover:rotate-90 z-[110] bg-white/10 p-2 rounded-full backdrop-blur-md"
                        title="Fechar (Esc)"
                    >
                        <X size={32} />
                    </button>
                    
                    {/* Navegação Anterior */}
                    <button 
                        onClick={prevImage} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-blue-400 p-4 transition-colors z-[110] hidden md:flex bg-white/5 hover:bg-white/10 rounded-full"
                    >
                        <ChevronLeft size={48} />
                    </button>
                    
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="relative max-w-full max-h-full flex items-center justify-center">
                            <img 
                                src={selectedProperty.images?.[currentImageIndex]} 
                                className="max-w-full max-h-[90vh] object-contain shadow-2xl animate-in zoom-in-95 duration-500 select-none" 
                                alt=""
                            />
                            {/* Marca d'água opcional no zoom */}
                            <Watermark sizeClasses="max-w-[200px] md:max-w-[350px] opacity-20" />
                        </div>
                        
                        <div className="mt-4 flex flex-col items-center">
                            <span className="text-white font-bold bg-white/10 px-6 py-2 rounded-full text-sm backdrop-blur-md border border-white/10 shadow-xl">
                                {currentImageIndex + 1} / {selectedProperty.images?.length}
                            </span>
                        </div>
                    </div>
                    
                    {/* Navegação Próximo */}
                    <button 
                        onClick={nextImage} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-blue-400 p-4 transition-colors z-[110] hidden md:flex bg-white/5 hover:bg-white/10 rounded-full"
                    >
                        <ChevronRight size={48} />
                    </button>

                    {/* Controles Mobile Flutuantes */}
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-12 md:hidden z-[110]">
                        <button onClick={prevImage} className="text-white p-5 bg-white/10 rounded-full backdrop-blur-md active:bg-white/20"><ChevronLeft size={36}/></button>
                        <button onClick={nextImage} className="text-white p-5 bg-white/10 rounded-full backdrop-blur-md active:bg-white/20"><ChevronRight size={36}/></button>
                    </div>
                </div>
            )}

            <footer className="bg-white text-slate-600 py-12 px-4 md:px-6 border-t border-slate-200 mt-auto">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
                    <div>
                        <div className="flex items-center space-x-2 text-slate-900 mb-6">
                            {agency?.logoUrl ? (
                                <img src={agency.logoUrl} className="h-10 md:h-12 w-auto object-contain" alt={agency.name} />
                            ) : (
                                <div className="flex items-center space-x-2 text-slate-800">
                                    <Building2 size={28} />
                                    <span className="text-xl md:text-2xl font-bold tracking-tight">{agency?.name || 'ImobERP'}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs text-slate-500 italic">Sua parceira de confiança no mercado imobiliário.</p>
                    </div>
                    <div>
                        <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-6">Contato</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center"><Mail size={16} className="mr-3 text-blue-600"/> {agency?.email || users.find(u => u.role === 'Admin')?.email || 'contato@imobiliaria.com.br'}</li>
                            {agency?.phone && <li className="flex items-center font-bold text-slate-800"><Phone size={16} className="mr-3 text-blue-600"/> {agency.phone}</li>}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-6">Localização</h4>
                        <p className="text-sm flex items-start leading-relaxed">
                            {agency?.address ? (
                                <><MapPin size={18} className="mr-3 mt-0.5 text-blue-600 flex-shrink-0" /><span>{agency.city || ''}</span></>
                            ) : "Atendemos em toda a região."}
                        </p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <p>&copy; {new Date().getFullYear()} {agency?.name}. Todos os direitos reservados.</p>
                    <p>Plataforma Desenvolvida por CRM Líder</p>
                </div>
            </footer>
        </div>
    );
};
