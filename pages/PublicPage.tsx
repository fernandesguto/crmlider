
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
    }, [lightboxOpen, selectedProperty]);

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
            <header className="bg-slate-100 shadow-sm sticky top-0 z-40 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        {agency?.logoUrl ? (
                            <img src={agency.logoUrl} className="h-10 md:h-12 w-auto object-contain" alt={agency.name} />
                        ) : (
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Building2 size={28} />
                                <span className="text-xl md:text-2xl font-bold tracking-tight