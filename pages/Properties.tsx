
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType, LeadStatus, PropertyCategory, PropertySubtype } from '../types';
import { Plus, Trash2, MapPin, BedDouble, Bath, Square, Sparkles, Upload, Image as ImageIcon, ArrowLeft, User, Phone, Mail, MessageCircle, Edit, X, ChevronLeft, ChevronRight, Tag, ShieldCheck, FileText, CheckCircle, DollarSign, RotateCcw, Search, Filter, Key } from 'lucide-react';
import { generatePropertyDescription } from '../services/geminiService';
import { uploadImage } from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';

export const Properties: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, markPropertyAsSold, reactivateProperty, getNextPropertyCode, currentUser, leads, users, currentAgency } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Code Preview
  const [previewCode, setPreviewCode] = useState<number>(0);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  // Sold/Reactivate Modal State
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [selectedBuyerLead, setSelectedBuyerLead] = useState<string>('');
  const [saleType, setSaleType] = useState<'internal' | 'external'>('internal');
  
  // Commission States
  const [finalSalePrice, setFinalSalePrice] = useState<number>(0);
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionPercent, setCommissionPercent] = useState<string>('6'); 
  const [commissionFixed, setCommissionFixed] = useState<number>(0);
  const [calculatedCommission, setCalculatedCommission] = useState<number>(0);

  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- FILTERS STATE ---
  const [searchText, setSearchText] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [featureFilter, setFeatureFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // New Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('');
  const [bathroomsFilter, setBathroomsFilter] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '', type: PropertyType.SALE, category: 'Residencial', subtype: 'Casa', price: 0,
    address: '', neighborhood: '', city: '', state: '', ownerName: '', ownerPhone: '', internalNotes: '',
    bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '', images: [], status: 'Active'
  });
  
  const [pendingFiles, setPendingFiles] = useState<{file: File, preview: string}[]>([]);
  const [newFeature, setNewFeature] = useState('');

  // --- CURRENCY HELPERS ---
  const parseCurrency = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // --- FILTER LOGIC ---
  const allFeatures = Array.from(new Set(properties.flatMap(p => p.features || []))).sort();
  // Get unique cities from existing properties
  const allCities = Array.from(new Set(properties.map(p => p.city || '').filter(c => c !== ''))).sort();

  const filteredProperties = properties
      .filter(property => {
          const searchLower = searchText.toLowerCase();
          const matchText = !searchText || 
              property.title.toLowerCase().includes(searchLower) ||
              property.address.toLowerCase().includes(searchLower) ||
              (property.neighborhood || '').toLowerCase().includes(searchLower) ||
              (property.city || '').toLowerCase().includes(searchLower) ||
              (property.code?.toString().includes(searchLower));

          const matchMinPrice = !priceMin || property.price >= Number(priceMin);
          const matchMaxPrice = !priceMax || property.price <= Number(priceMax);
          const matchType = !typeFilter || property.type === typeFilter;
          const matchFeature = !featureFilter || (property.features && property.features.includes(featureFilter));
          
          // New Filters Logic
          const matchCategory = !categoryFilter || property.category === categoryFilter;
          const matchSubtype = !subtypeFilter || property.subtype === subtypeFilter;
          const matchCity = !cityFilter || property.city === cityFilter;
          const matchBedrooms = !bedroomsFilter || property.bedrooms >= Number(bedroomsFilter);
          const matchBathrooms = !bathroomsFilter || property.bathrooms >= Number(bathroomsFilter);

          return matchText && matchMinPrice && matchMaxPrice && matchType && matchFeature && 
                 matchCategory && matchSubtype && matchCity && matchBedrooms && matchBathrooms;
      })
      .sort((a, b) => {
          // 1. Ordenar por Status: Active primeiro, Sold depois
          if (a.status === 'Active' && b.status !== 'Active') return -1;
          if (a.status !== 'Active' && b.status === 'Active') return 1;
          
          // 2. Ordenar por Código: Mais novos primeiro (Decrescente)
          return (b.code || 0) - (a.code || 0);
      });

  const clearFilters = () => {
      setSearchText('');
      setPriceMin('');
      setPriceMax('');
      setTypeFilter('');
      setFeatureFilter('');
      setCategoryFilter('');
      setSubtypeFilter('');
      setCityFilter('');
      setBedroomsFilter('');
      setBathroomsFilter('');
  };

  // --- LIGHTBOX LOGIC ---
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedProperty?.images && selectedProperty.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProperty.images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedProperty?.images && selectedProperty.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedProperty]);

  const scrollThumbnails = (direction: 'left' | 'right') => {
      if (thumbnailsRef.current) {
          const scrollAmount = 300;
          thumbnailsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeature && !formData.features?.includes(newFeature)) {
      setFormData(prev => ({ ...prev, features: [...(prev.features || []), newFeature] }));
      setNewFeature('');
    }
  };

  const removeFeature = (feat: string) => {
    setFormData(prev => ({ ...prev, features: prev.features?.filter(f => f !== feat) }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentCount = (formData.images?.length || 0) + pendingFiles.length;
      if (currentCount + files.length > 10) {
          alert('Você só pode adicionar até 10 fotos no total.');
          return;
      }
      const newPending: {file: File, preview: string}[] = [];
      const MAX_SIZE = 10 * 1024 * 1024;
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > MAX_SIZE) {
              alert(`A imagem "${file.name}" excede o limite de 10MB.`);
              continue;
          }
          const preview = URL.createObjectURL(file);
          newPending.push({ file, preview });
      }
      setPendingFiles(prev => [...prev, ...newPending]);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
      const existingCount = formData.images?.length || 0;
      if (indexToRemove < existingCount) {
          setFormData(prev => ({ ...prev, images: prev.images?.filter((_, index) => index !== indexToRemove) }));
      } else {
          const localIndex = indexToRemove - existingCount;
          setPendingFiles(prev => prev.filter((_, index) => index !== localIndex));
      }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.area) {
      alert("Preencha título e área para gerar descrição.");
      return;
    }
    setIsGenerating(true);
    const desc = await generatePropertyDescription(formData.title!, formData.type as PropertyType, formData.features || [], Number(formData.area), Number(formData.bedrooms));
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleOpenCreate = () => {
      resetForm();
      setPreviewCode(getNextPropertyCode());
      setShowForm(true);
  };

  const handleOpenEdit = (property: Property) => {
      setFormData({ ...property, images: property.images || [] });
      setPreviewCode(property.code || 0);
      setPendingFiles([]);
      setIsEditing(true);
      setEditingId(property.id);
      setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const uploadedUrls: string[] = [];
        for (const pf of pendingFiles) {
            const url = await uploadImage(pf.file);
            if (url) uploadedUrls.push(url);
        }
        const finalImages = [...(formData.images || []), ...uploadedUrls];
        if (finalImages.length === 0) finalImages.push(`https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/600`);

        const propertyData = {
            ...formData,
            price: Number(formData.price),
            bedrooms: Number(formData.bedrooms),
            bathrooms: Number(formData.bathrooms),
            area: Number(formData.area),
            images: finalImages,
            // Mantém o broker original se editando, senão usa o atual
            brokerId: (isEditing && formData.brokerId) ? formData.brokerId : currentUser.id, 
            agencyId: (isEditing && formData.agencyId) ? formData.agencyId : (currentAgency?.id || ''),
            status: (formData.status || 'Active') as 'Active' | 'Sold'
        } as Property;

        if (isEditing && editingId) {
            await updateProperty({ ...propertyData, id: editingId, code: previewCode });
            if (selectedProperty && selectedProperty.id === editingId) setSelectedProperty(propertyData);
        } else {
            await addProperty({ ...propertyData, id: Date.now().toString() });
        }
        setShowForm(false);
        resetForm();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar imóvel.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- SOLD/RENTED HELPER ---
  const isRental = (type: string) => type.includes('Locação');

  // --- SOLD HANDLER ---
  const handleOpenSoldModal = () => {
      setSaleType('internal');
      setSelectedBuyerLead('');
      
      const initialPrice = selectedProperty?.price || 0;
      setFinalSalePrice(initialPrice);
      
      setCommissionType('percent');
      setCommissionPercent('6'); // Padrão venda
      setCommissionFixed(0);

      if (selectedProperty && isRental(selectedProperty.type)) {
          setCommissionFixed(initialPrice); // Padrão aluguel: 1º aluguel
          setCommissionType('fixed');
      }
      
      setCalculatedCommission(0);
      setSoldModalOpen(true);
  };

  // Recalcular comissão quando valores mudam
  useEffect(() => {
      const price = finalSalePrice;
      
      if (commissionType === 'percent') {
          const percent = parseFloat(commissionPercent);
          if (!isNaN(price) && !isNaN(percent)) {
              setCalculatedCommission(price * (percent / 100));
          } else {
              setCalculatedCommission(0);
          }
      } else {
          setCalculatedCommission(commissionFixed);
      }
  }, [finalSalePrice, commissionPercent, commissionFixed, commissionType]);

  const handleConfirmSold = async () => {
      if (selectedProperty) {
          try {
              if (saleType === 'internal' && !selectedBuyerLead) {
                  alert("Selecione o Lead.");
                  return;
              }

              const leadId = saleType === 'internal' ? selectedBuyerLead : null;
              // Se for venda externa, o valor da venda não conta (0) para não estragar dashboard
              const saleVal = saleType === 'internal' ? finalSalePrice : 0;
              // Se for venda externa, comissão é zero (não conta pro dashboard)
              const commVal = saleType === 'internal' ? calculatedCommission : 0;

              await markPropertyAsSold(selectedProperty.id, leadId, saleVal, commVal);
              
              setSelectedProperty(prev => prev ? ({...prev, status: 'Sold', soldToLeadId: leadId || undefined, salePrice: saleVal, commissionValue: commVal}) : null);
              setSoldModalOpen(false);
          } catch (error) {
              console.error(error);
              alert("Erro ao marcar como fechado.");
          }
      }
  };

  const handleConfirmReactivate = async () => {
      if (selectedProperty) {
          try {
              await reactivateProperty(selectedProperty.id);
              setSelectedProperty(prev => prev ? ({...prev, status: 'Active', soldAt: undefined, soldToLeadId: undefined, salePrice: undefined, commissionValue: undefined}) : null);
              setReactivateModalOpen(false);
          } catch (error) {
              console.error(error);
              alert("Erro ao reativar.");
          }
      }
  }

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPropertyToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (propertyToDelete) {
        await deleteProperty(propertyToDelete);
        if (selectedProperty && selectedProperty.id === propertyToDelete) setSelectedProperty(null);
    }
    setPropertyToDelete(null);
  };

  const resetForm = () => {
    setFormData({
        title: '', type: PropertyType.SALE, category: 'Residencial', subtype: 'Casa', price: 0, 
        address: '', neighborhood: '', city: '', state: '', ownerName: '', ownerPhone: '', internalNotes: '',
        bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '', images: [], status: 'Active'
    });
    setPendingFiles([]);
    setIsEditing(false);
    setEditingId(null);
  };

  const getBrokerName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';
  const getInterestedLeads = (propId: string) => leads.filter(l => l.interestedInPropertyIds.includes(propId));
  const formatCode = (code?: number) => code ? `#${code.toString().padStart(5, '0')}` : '#00000';
  const displayImages = [...(formData.images || []), ...pendingFiles.map(p => p.preview)];

  const renderForm = () => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto my-8 animate-in fade-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                {isEditing ? <Edit className="mr-2 text-blue-600" size={24}/> : <Plus className="mr-2 text-blue-600" size={24}/>}
                {isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
                <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                    Código: {formatCode(previewCode)}
                </span>
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título do Anúncio</label>
                    <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Apartamento Vista Mar" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Negócio</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Valor (R$)</label>
                        <input 
                            type="text" 
                            name="price" 
                            required 
                            value={formatCurrency(Number(formData.price))} 
                            onChange={(e) => {
                                const val = parseCurrency(e.target.value);
                                setFormData(prev => ({ ...prev, price: val }));
                            }} 
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            {['Residencial', 'Comercial', 'Terreno / Área', 'Rural', 'Industrial'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Subtipo</label>
                        <select name="subtype" value={formData.subtype} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                            {['Casa', 'Apartamento', 'Sala', 'Loja', 'Prédio', 'Galpão', 'Terreno', 'Chácara'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Endereço (Rua/Av e Número)</label>
                    <input name="address" required value={formData.address} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rua das Flores, 123" />
                </div>

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bairro</label>
                        <input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label>
                        <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Estado (UF)</label>
                        <input name="state" maxLength={2} value={formData.state} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="SP" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Quartos</label>
                        <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Banheiros</label>
                        <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Área (m²)</label>
                        <input type="number" name="area" value={formData.area} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            {/* Seção Privada */}
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 mb-6">
                <h3 className="text-sm font-bold text-amber-800 uppercase mb-4 flex items-center"><ShieldCheck size={16} className="mr-2"/> Dados Privados (Não aparecem no site)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-amber-900 mb-1">Nome do Proprietário</label>
                        <input name="ownerName" value={formData.ownerName} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-amber-900 mb-1">Telefone do Proprietário</label>
                        <input name="ownerPhone" value={formData.ownerPhone} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-amber-900 mb-1">Observações Internas</label>
                        <textarea name="internalNotes" rows={2} value={formData.internalNotes} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                </div>
            </div>

            {/* Descrição e IA */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                    Descrição do Imóvel
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="ml-3 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition disabled:opacity-50">
                        {isGenerating ? <><Sparkles size={12} className="inline mr-1 animate-spin"/> Gerando...</> : <><Sparkles size={12} className="inline mr-1"/> Gerar com IA</>}
                    </button>
                </label>
                <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva os detalhes do imóvel..." />
            </div>

            {/* Fotos */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Fotos do Imóvel (Máx 10)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {displayImages.map((src, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={src} alt={`Foto ${index}`} className="w-full h-full object-cover rounded-lg border border-slate-200" />
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"><X size={14} /></button>
                            {index === 0 && <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Capa</span>}
                        </div>
                    ))}
                    {(displayImages.length < 10) && (
                        <label className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition aspect-square text-slate-400 hover:text-blue-500">
                            <ImageIcon size={24} className="mb-1" />
                            <span className="text-xs font-semibold">Adicionar</span>
                            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    )}
                </div>
            </div>

            {/* Features */}
            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">Diferenciais</label>
                <div className="flex gap-2 mb-3">
                    <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="flex-1 bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Piscina, Churrasqueira..." onKeyPress={(e) => e.key === 'Enter' && handleAddFeature(e)} />
                    <button type="button" onClick={handleAddFeature} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition font-bold text-sm">Adicionar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.features?.map(feat => (
                        <span key={feat} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center font-medium border border-slate-200">
                            {feat} <button type="button" onClick={() => removeFeature(feat)} className="ml-2 text-slate-400 hover:text-red-500"><X size={14} /></button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-70 shadow-lg shadow-blue-500/30">
                    {isSaving ? 'Salvando...' : (isEditing ? 'Atualizar Imóvel' : 'Cadastrar Imóvel')}
                </button>
            </div>
        </form>
    </div>
  );

  if (selectedProperty) {
    if (showForm) {
        return <div className="p-8 h-screen overflow-y-auto bg-slate-50">{renderForm()}</div>;
    }

    const interestedLeads = getInterestedLeads(selectedProperty.id);
    const isRentalProperty = isRental(selectedProperty.type);

    return (
      <div className="p-8 h-screen overflow-y-auto bg-slate-50">
        {/* ... Header ... */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedProperty(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition"><ArrowLeft size={20} /></button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    {selectedProperty.title}
                    <span className="ml-3 text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{formatCode(selectedProperty.code)}</span>
                    {selectedProperty.status === 'Sold' && (
                        <span className="ml-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            {isRentalProperty ? 'Locado' : 'Vendido'}
                        </span>
                    )}
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center">
                    <span className="font-semibold">{selectedProperty.category}</span><span className="mx-2">/</span><span className="font-semibold">{selectedProperty.subtype || 'Casa'}</span><span className="mx-2">•</span>{selectedProperty.type}
                </p>
                <p className="text-sm text-slate-600 mt-1.5 flex items-center">
                    <MapPin size={14} className="mr-1.5 text-slate-400" />
                    {selectedProperty.address} - {selectedProperty.neighborhood}, {selectedProperty.city} - {selectedProperty.state}
                </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {selectedProperty.status === 'Sold' ? (
                <button onClick={() => setReactivateModalOpen(true)} className="bg-amber-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-amber-600 transition"><RotateCcw size={18} /><span>Reativar Anúncio</span></button>
            ) : (
                <button onClick={handleOpenSoldModal} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition">
                    {isRentalProperty ? <Key size={18} /> : <DollarSign size={18} />}
                    <span>{isRentalProperty ? 'Marcar como Locado' : 'Marcar como Vendido'}</span>
                </button>
            )}
            <button onClick={() => handleOpenEdit(selectedProperty)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"><Edit size={18} /><span>Editar</span></button>
          </div>
        </div>

        {/* Detail Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* Left Col */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                    {/* Image Gallery */}
                    <div className="h-96 relative group cursor-pointer bg-slate-100" onClick={() => openLightbox(0)}>
                        <img src={selectedProperty.images?.[0]} className="w-full h-full object-cover" alt=""/>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center"><ImageIcon size={18} className="mr-2"/> Ver Galeria</span>
                        </div>
                    </div>
                    {/* Thumbnails */}
                    {selectedProperty.images && selectedProperty.images.length > 1 && (
                        <div className="relative border-b border-slate-100 bg-slate-50/50 group">
                            <button onClick={() => scrollThumbnails('left')} className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-slate-100 to-transparent w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-slate-200/50"><ChevronLeft size={24} className="text-slate-600" /></button>
                            <div ref={thumbnailsRef} className="flex p-4 gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {selectedProperty.images.map((img, idx) => (
                                    <img key={idx} src={img} onClick={() => openLightbox(idx)} className="w-24 h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition hover:ring-2 hover:ring-blue-500 flex-shrink-0 snap-center" alt="" />
                                ))}
                            </div>
                            <button onClick={() => scrollThumbnails('right')} className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-slate-100 to-transparent w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-slate-200/50"><ChevronRight size={24} className="text-slate-600" /></button>
                        </div>
                    )}
                    {/* Details */}
                    <div className="p-8">
                        {/* Info Rows */}
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                            <div className="grid grid-cols-3 gap-12">
                                <div className="text-center"><div className="flex items-center justify-center text-blue-600 mb-1"><BedDouble size={28} /></div><p className="text-2xl font-bold text-slate-800">{selectedProperty.bedrooms}</p><p className="text-xs text-slate-500 uppercase font-semibold">Quartos</p></div>
                                <div className="text-center"><div className="flex items-center justify-center text-blue-600 mb-1"><Bath size={28} /></div><p className="text-2xl font-bold text-slate-800">{selectedProperty.bathrooms}</p><p className="text-xs text-slate-500 uppercase font-semibold">Banheiros</p></div>
                                <div className="text-center"><div className="flex items-center justify-center text-blue-600 mb-1"><Square size={28} /></div><p className="text-2xl font-bold text-slate-800">{selectedProperty.area}</p><p className="text-xs text-slate-500 uppercase font-semibold">m² Área</p></div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 mb-1">Valor</p>
                                <p className="text-4xl font-bold text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.price)}</p>
                            </div>
                        </div>
                        {/* Desc e Features */}
                        <div className="mb-8"><h3 className="text-lg font-bold text-slate-800 mb-3">Sobre o imóvel</h3><p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedProperty.description}</p></div>
                        {/* Features List */}
                        {selectedProperty.features && selectedProperty.features.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-3">Diferenciais</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProperty.features.map(feat => (
                                        <span key={feat} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium border border-slate-200 flex items-center"><CheckCircle size={14} className="mr-1.5 text-blue-500"/> {feat}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Dados Internos */}
                        <div className="bg-amber-50 rounded-lg p-5 border border-amber-100">
                            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide flex items-center mb-4"><ShieldCheck size={16} className="mr-2" /> Informações Internas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-amber-600/70 font-semibold uppercase mb-1">Proprietário</p>
                                    <div className="flex items-center space-x-2 text-amber-900 font-medium"><User size={16} className="opacity-50" /><span>{selectedProperty.ownerName || 'Não informado'}</span></div>
                                    {selectedProperty.ownerPhone && (<div className="flex items-center space-x-2 text-amber-900 mt-1 ml-6"><Phone size={14} className="opacity-50" /><span>{selectedProperty.ownerPhone}</span></div>)}
                                </div>
                                <div>
                                    <p className="text-xs text-amber-600/70 font-semibold uppercase mb-1">Observações Privadas</p>
                                    <div className="flex items-start space-x-2 text-amber-900 text-sm"><FileText size={16} className="opacity-50 mt-0.5 flex-shrink-0" /><p>{selectedProperty.internalNotes || 'Nenhuma.'}</p></div>
                                </div>
                            </div>
                        </div>
                        {/* Dados da Venda (Se vendido) */}
                        {selectedProperty.status === 'Sold' && selectedProperty.salePrice && (
                            <div className="mt-6 bg-green-50 rounded-lg p-5 border border-green-100">
                                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide flex items-center mb-4"><DollarSign size={16} className="mr-2" /> Dados do Fechamento</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-green-600/70 font-semibold uppercase mb-1">
                                            {isRentalProperty ? 'Valor do Contrato' : 'Valor da Venda'}
                                        </p>
                                        <p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.salePrice)}</p>
                                    </div>
                                    <div><p className="text-xs text-green-600/70 font-semibold uppercase mb-1">Comissão Gerada</p><p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.commissionValue || 0)}</p></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Right Col */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Corretor Responsável</h3>
                    <div className="flex items-center space-x-3"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={24} /></div><div><p className="font-bold text-slate-800 text-lg">{getBrokerName(selectedProperty.brokerId)}</p><p className="text-slate-500 text-sm">Captador</p></div></div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between"><button onClick={(e) => handleDeleteClick(selectedProperty.id, e)} className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /><span>Excluir Imóvel</span></button></div>
                </div>
                {/* Leads List ... */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-slate-800 flex items-center"><MessageCircle className="mr-2 text-blue-500" size={20} />Leads Interessados ({interestedLeads.length})</h3></div>
                    <div className="overflow-y-auto flex-1 p-2">
                        {interestedLeads.map(lead => (
                            <div key={lead.id} className="bg-white border border-slate-100 rounded-lg p-3 mb-2 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2"><div><p className="font-bold text-slate-800">{lead.name}</p><p className="text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</p></div><span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 text-slate-600">{lead.status}</span></div>
                                <div className="flex space-x-2 mt-3"><a href={`mailto:${lead.email}`} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium py-2 rounded flex items-center justify-center space-x-1 border border-slate-200 transition"><Mail size={14} /> <span>Email</span></a><a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium py-2 rounded flex items-center justify-center space-x-1 border border-green-200 transition"><Phone size={14} /> <span>WhatsApp</span></a></div>
                            </div>
                        ))}
                        {interestedLeads.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">Nenhum lead marcou interesse ainda.</p>}
                    </div>
                </div>
            </div>
        </div>

        <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Imóvel" message="Tem certeza?" confirmText="Excluir" isDestructive />
        <ConfirmModal isOpen={reactivateModalOpen} onClose={() => setReactivateModalOpen(false)} onConfirm={handleConfirmReactivate} title="Reativar Imóvel" message="Deseja colocar este imóvel à venda novamente?" confirmText="Reativar" isDestructive={false} />

        {/* --- MODAL DE CONFIRMAÇÃO DE VENDA COM COMISSÃO --- */}
        {soldModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800">
                            {isRental(selectedProperty.type) ? 'Fechar Locação' : 'Fechar Venda'}
                        </h2>
                        <button onClick={() => setSoldModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-5">
                        {/* 1. Comprador */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                {isRental(selectedProperty.type) ? 'Quem alugou este imóvel?' : 'Quem comprou este imóvel?'}
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 bg-white">
                                    <input type="radio" name="saleType" checked={saleType === 'internal'} onChange={() => setSaleType('internal')} className="w-4 h-4 text-blue-600"/>
                                    <span className="font-medium text-slate-800">Cliente da Imobiliária (Lead)</span>
                                </label>
                                {saleType === 'internal' && (
                                    <div className="ml-7">
                                        <select className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm bg-white" value={selectedBuyerLead} onChange={(e) => setSelectedBuyerLead(e.target.value)}>
                                            <option value="">Selecione o Lead...</option>
                                            {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name} ({lead.status})</option>)}
                                        </select>
                                    </div>
                                )}
                                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 bg-white">
                                    <input type="radio" name="saleType" checked={saleType === 'external'} onChange={() => setSaleType('external')} className="w-4 h-4 text-blue-600"/>
                                    <div><span className="block font-medium text-slate-800">Venda Externa / Outra Imobiliária</span><span className="text-xs text-slate-500">Apenas marca como vendido no sistema</span></div>
                                </label>
                            </div>
                        </div>

                        {/* 2. Valor Fechado - Apenas se Interno */}
                        {saleType === 'internal' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    {isRental(selectedProperty.type) ? 'Valor do Contrato/Aluguel (R$)' : 'Valor Final da Venda (R$)'}
                                </label>
                                <input 
                                    type="text" 
                                    value={formatCurrency(finalSalePrice)} 
                                    onChange={e => setFinalSalePrice(parseCurrency(e.target.value))} 
                                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-500 font-semibold text-slate-900" 
                                />
                            </div>
                        )}

                        {/* 3. Comissão (Only if internal) */}
                        {saleType === 'internal' && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Comissão / Agenciamento</label>
                                <div className="flex gap-2 mb-2">
                                    <button type="button" onClick={() => setCommissionType('percent')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${commissionType === 'percent' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>Porcentagem (%)</button>
                                    <button type="button" onClick={() => setCommissionType('fixed')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${commissionType === 'fixed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>Valor Fixo (R$)</button>
                                </div>
                                <div className="flex items-center gap-3">
                                    {commissionType === 'percent' ? (
                                        <input 
                                            type="number" 
                                            value={commissionPercent} 
                                            onChange={e => setCommissionPercent(e.target.value)} 
                                            className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-900"
                                            placeholder="6"
                                        />
                                    ) : (
                                        <input 
                                            type="text" 
                                            value={formatCurrency(commissionFixed)} 
                                            onChange={e => setCommissionFixed(parseCurrency(e.target.value))} 
                                            className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-900"
                                        />
                                    )}
                                    <div className="text-right flex-1">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Valor a Receber</p>
                                        <p className="text-xl font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedCommission)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                        <button onClick={() => setSoldModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button onClick={handleConfirmSold} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center"><CheckCircle size={18} className="mr-2"/> Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {lightboxOpen && (
            <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4">
                <button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:text-slate-300"><X size={32}/></button>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-4"><ChevronLeft size={48}/></button>
                <div className="max-w-7xl max-h-[90vh]">
                    <img src={selectedProperty.images?.[currentImageIndex]} className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm" alt=""/>
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 font-medium">
                        {currentImageIndex + 1} / {selectedProperty.images?.length}
                    </div>
                </div>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-4"><ChevronRight size={48}/></button>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 h-screen overflow-y-auto">
        {!showForm ? (
            <>
                <div className="flex justify-between items-center mb-6">
                    <div><h1 className="text-3xl font-bold text-slate-800">Imóveis</h1></div>
                    <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"><Plus size={20} /><span>Cadastrar Imóvel</span></button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center space-x-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100 pb-2">
                        <Filter size={14} /> <span>Filtros Avançados</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Linha 1 */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input type="text" placeholder="Nome, Endereço, Código..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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

                    {(searchText || priceMin || priceMax || typeFilter || featureFilter || categoryFilter || subtypeFilter || cityFilter || bedroomsFilter || bathroomsFilter) && (
                        <div className="flex justify-end border-t border-slate-100 pt-3">
                            <button onClick={clearFilters} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-medium text-sm flex items-center">
                                <X size={14} className="mr-1" /> Limpar Filtros
                            </button>
                        </div>
                    )}
                    <div className="mt-2 text-right text-xs text-slate-400">
                        {filteredProperties.length} imóveis encontrados
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {filteredProperties.map(property => (
                        <div key={property.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition duration-200 cursor-pointer group ${property.status === 'Sold' ? 'opacity-75' : ''}`} onClick={() => setSelectedProperty(property)}>
                            <div className="h-48 overflow-hidden relative">
                                <img src={property.images?.[0] || 'https://via.placeholder.com/400'} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute top-0 right-0 bg-white/90 px-2 py-1 rounded-bl-lg text-xs font-bold font-mono border-l border-b border-slate-200 shadow-sm text-slate-800">
                                    {formatCode(property.code)}
                                </div>
                                {property.status === 'Sold' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <span className={`bg-red-600 text-white font-bold px-4 py-1 rounded shadow-lg transform -rotate-12 uppercase border-2 border-white`}>
                                            {isRental(property.type) ? 'Locado' : 'Vendido'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 flex gap-1">
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">{property.type}</span>
                                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{property.subtype}</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{property.title}</h3>
                                <p className="text-slate-500 text-xs mb-3 flex items-center"><MapPin size={12} className="mr-1"/> {property.address}</p>
                                <div className="flex items-center justify-between text-slate-600 text-xs mb-4">
                                    <span className="flex items-center"><BedDouble size={14} className="mr-1 text-blue-400"/> {property.bedrooms}</span>
                                    <span className="flex items-center"><Bath size={14} className="mr-1 text-blue-400"/> {property.bathrooms}</span>
                                    <span className="flex items-center"><Square size={14} className="mr-1 text-blue-400"/> {property.area}m²</span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <p className="text-xl font-bold text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Delete Modal for List View */}
                <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Imóvel" message="Tem certeza?" confirmText="Excluir" isDestructive />
            </>
        ) : (
            // Form render
            renderForm()
        )}
    </div>
  );
};
