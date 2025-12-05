import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType, LeadStatus } from '../types';
import { Plus, Trash2, MapPin, BedDouble, Bath, Square, Sparkles, Upload, Image as ImageIcon, ArrowLeft, User, Phone, Mail, MessageCircle, Edit, X } from 'lucide-react';
import { generatePropertyDescription } from '../services/geminiService';
import { uploadImage } from '../services/db';

export const Properties: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, currentUser, leads, users, currentAgency } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    type: PropertyType.SALE,
    price: 0,
    address: '',
    bedrooms: 1,
    bathrooms: 1,
    area: 50,
    features: [],
    description: '',
    images: [] // URLs já salvas (remotas)
  });
  
  // Files pendentes de upload (locais)
  const [pendingFiles, setPendingFiles] = useState<{file: File, preview: string}[]>([]);

  // Feature input state
  const [newFeature, setNewFeature] = useState('');

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
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB

      for (let i = 0; i < files.length; i++) {
          const file = files[i];

          if (file.size > MAX_SIZE) {
              alert(`A imagem "${file.name}" excede o limite de 10MB e não será adicionada.`);
              continue;
          }

          const preview = URL.createObjectURL(file);
          newPending.push({ file, preview });
      }
      
      setPendingFiles(prev => [...prev, ...newPending]);
      
      // Reset input para permitir selecionar o mesmo arquivo se necessário
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
      const existingCount = formData.images?.length || 0;
      
      if (indexToRemove < existingCount) {
          // Removendo imagem remota (já salva)
          setFormData(prev => ({
              ...prev,
              images: prev.images?.filter((_, index) => index !== indexToRemove)
          }));
      } else {
          // Removendo imagem local (pendente)
          const localIndex = indexToRemove - existingCount;
          setPendingFiles(prev => prev.filter((_, index) => index !== localIndex));
      }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.area) {
      alert("Preencha pelo menos o título e a área para gerar uma descrição.");
      return;
    }
    setIsGenerating(true);
    const desc = await generatePropertyDescription(
      formData.title!,
      formData.type as PropertyType,
      formData.features || [],
      Number(formData.area),
      Number(formData.bedrooms)
    );
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleOpenEdit = (property: Property) => {
      setFormData({
          title: property.title,
          type: property.type,
          price: property.price,
          address: property.address,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          description: property.description,
          features: property.features,
          images: property.images || []
      });
      setPendingFiles([]); // Limpa pendentes ao abrir edição
      setIsEditing(true);
      setEditingId(property.id);
      setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        // 1. Fazer upload das imagens pendentes
        const uploadedUrls: string[] = [];
        for (const pf of pendingFiles) {
            const url = await uploadImage(pf.file);
            if (url) uploadedUrls.push(url);
        }

        // 2. Combinar imagens antigas com novas
        const finalImages = [
            ...(formData.images || []),
            ...uploadedUrls
        ];

        // Se não tiver imagem nenhuma, coloca placeholder
        if (finalImages.length === 0) {
            finalImages.push(`https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/600`);
        }

        if (isEditing && editingId) {
            // Update
            const updatedProperty: Property = {
                id: editingId,
                title: formData.title!,
                description: formData.description || '',
                type: formData.type as PropertyType,
                price: Number(formData.price),
                address: formData.address!,
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                area: Number(formData.area),
                images: finalImages,
                features: formData.features || [],
                brokerId: currentUser.id, 
                agencyId: currentAgency?.id || ''
            };
            await updateProperty(updatedProperty);
            
            if (selectedProperty && selectedProperty.id === editingId) {
                setSelectedProperty(updatedProperty);
            }
        } else {
            // Create
            const newProperty: Property = {
              id: Date.now().toString(),
              title: formData.title!,
              description: formData.description || '',
              type: formData.type as PropertyType,
              price: Number(formData.price),
              address: formData.address!,
              bedrooms: Number(formData.bedrooms),
              bathrooms: Number(formData.bathrooms),
              area: Number(formData.area),
              images: finalImages,
              features: formData.features || [],
              brokerId: currentUser.id,
              agencyId: currentAgency?.id || ''
            };
            await addProperty(newProperty);
        }

        setShowForm(false);
        resetForm();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar imóvel. Verifique a conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
        title: '', type: PropertyType.SALE, price: 0, address: '', bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '',
        images: []
    });
    setPendingFiles([]);
    setIsEditing(false);
    setEditingId(null);
  };

  const getBrokerName = (id: string) => {
    return users.find(u => u.id === id)?.name || 'Desconhecido';
  };

  const getInterestedLeads = (propId: string) => {
    return leads.filter(l => l.interestedInPropertyIds.includes(propId));
  };

  // Lista combinada para exibição no formulário
  const displayImages = [...(formData.images || []), ...pendingFiles.map(p => p.preview)];

  // --- DETAIL VIEW ---
  if (selectedProperty) {
    const interestedLeads = getInterestedLeads(selectedProperty.id);

    return (
      <div className="p-8 h-screen overflow-y-auto bg-slate-50">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
                onClick={() => setSelectedProperty(null)}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Detalhes do Imóvel</h1>
          </div>
          <button 
             onClick={() => handleOpenEdit(selectedProperty)}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
          >
             <Edit size={18} />
             <span>Editar Imóvel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left Column: Images & Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {/* Galeria Principal */}
               <div className="h-96 relative">
                 <img 
                    src={selectedProperty.images?.[0] || 'https://via.placeholder.com/800'} 
                    alt={selectedProperty.title} 
                    className="w-full h-full object-cover" 
                 />
                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wide text-slate-900 shadow-sm">
                    {selectedProperty.type}
                 </div>
                 <div className="absolute bottom-4 left-4 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-lg">
                    <h2 className="text-3xl font-bold text-white shadow-black drop-shadow-md">{selectedProperty.title}</h2>
                    <div className="flex items-center text-white/90 mt-1">
                      <MapPin size={16} className="mr-1" />
                      {selectedProperty.address}
                    </div>
                 </div>
               </div>

               {/* Miniaturas da Galeria */}
               {selectedProperty.images && selectedProperty.images.length > 1 && (
                   <div className="flex p-4 gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/50">
                       {selectedProperty.images.map((img, idx) => (
                           <img 
                            key={idx} 
                            src={img} 
                            className="w-20 h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition" 
                            alt={`Foto ${idx+1}`}
                           />
                       ))}
                   </div>
               )}
               
               <div className="p-8">
                  <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                     <div className="grid grid-cols-3 gap-12">
                        <div className="text-center">
                           <div className="flex items-center justify-center text-blue-600 mb-1"><BedDouble size={28} /></div>
                           <p className="text-2xl font-bold text-slate-800">{selectedProperty.bedrooms}</p>
                           <p className="text-xs text-slate-500 uppercase font-semibold">Quartos</p>
                        </div>
                        <div className="text-center">
                           <div className="flex items-center justify-center text-blue-600 mb-1"><Bath size={28} /></div>
                           <p className="text-2xl font-bold text-slate-800">{selectedProperty.bathrooms}</p>
                           <p className="text-xs text-slate-500 uppercase font-semibold">Banheiros</p>
                        </div>
                        <div className="text-center">
                           <div className="flex items-center justify-center text-blue-600 mb-1"><Square size={28} /></div>
                           <p className="text-2xl font-bold text-slate-800">{selectedProperty.area}</p>
                           <p className="text-xs text-slate-500 uppercase font-semibold">m² Área</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm text-slate-500 mb-1">Valor do Investimento</p>
                        <p className="text-4xl font-bold text-blue-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.price)}
                        </p>
                     </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Sobre o imóvel</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                      {selectedProperty.description || "Nenhuma descrição fornecida."}
                    </p>
                  </div>

                  {selectedProperty.features && selectedProperty.features.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">Destaques</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.features.map((feat, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Broker & Leads */}
          <div className="space-y-6">
             {/* Broker Card */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Corretor Responsável</h3>
                <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <User size={24} />
                   </div>
                   <div>
                      <p className="font-bold text-slate-800 text-lg">{getBrokerName(selectedProperty.brokerId)}</p>
                      <p className="text-slate-500 text-sm">Captador do Imóvel</p>
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between">
                   <button 
                     onClick={() => {
                       if(confirm('Tem certeza que deseja excluir este imóvel?')) {
                         deleteProperty(selectedProperty.id);
                         setSelectedProperty(null);
                       }
                     }}
                     className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                   >
                     <Trash2 size={18} />
                     <span>Excluir Imóvel</span>
                   </button>
                </div>
             </div>

             {/* Interested Leads */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <MessageCircle className="mr-2 text-blue-500" size={20} />
                    Leads Interessados ({interestedLeads.length})
                  </h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                   {interestedLeads.length > 0 ? (
                      <div className="space-y-2">
                        {interestedLeads.map(lead => (
                          <div key={lead.id} className="bg-white border border-slate-100 rounded-lg p-3 hover:shadow-md transition">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <p className="font-bold text-slate-800">{lead.name}</p>
                                   <p className="text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  lead.status === LeadStatus.NEW ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {lead.status}
                                </span>
                             </div>
                             <div className="flex space-x-2 mt-3">
                                <a 
                                  href={`mailto:${lead.email}`}
                                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium py-2 rounded flex items-center justify-center space-x-1 border border-slate-200 transition"
                                >
                                  <Mail size={14} /> <span>Email</span>
                                </a>
                                <a 
                                  href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium py-2 rounded flex items-center justify-center space-x-1 border border-green-200 transition"
                                >
                                  <Phone size={14} /> <span>WhatsApp</span>
                                </a>
                             </div>
                          </div>
                        ))}
                      </div>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                         <MessageCircle size={32} className="mb-2 opacity-50" />
                         <p className="text-sm">Nenhum lead interessado ainda.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST & FORM VIEW ---
  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Imóveis</h1>
           <p className="text-slate-500">Gerencie sua carteira de imóveis ({properties.length})</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
        >
          <Plus size={20} />
          <span>Cadastrar Imóvel</span>
        </button>
      </div>

      {!showForm ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <div 
                key={property.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition duration-200 cursor-pointer group"
                onClick={() => setSelectedProperty(property)}
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                    src={property.images?.[0] || 'https://via.placeholder.com/400'} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
                  {property.type}
                </div>
                {property.images && property.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center">
                        <ImageIcon size={12} className="mr-1" />
                        {property.images.length}
                    </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{property.title}</h3>
                </div>
                <div className="flex items-center text-slate-500 text-sm mb-4">
                  <MapPin size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{property.address}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center"><BedDouble size={16} className="mr-1 text-slate-400" /> {property.bedrooms}</div>
                  <div className="flex items-center"><Bath size={16} className="mr-1 text-slate-400" /> {property.bathrooms}</div>
                  <div className="flex items-center"><Square size={16} className="mr-1 text-slate-400" /> {property.area}m²</div>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-xl font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price)}
                    </p>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Detalhes</span>
                </div>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
               <div className="bg-slate-100 p-4 rounded-full mb-3">
                 <BedDouble size={48} className="opacity-50" />
               </div>
               <p className="text-lg font-medium">Nenhum imóvel cadastrado.</p>
               <p className="text-sm">Clique em "Cadastrar Imóvel" para começar.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">
                 {isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
             </h2>
             <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título do Anúncio</label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Ex: Apartamento Vista Mar"
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={PropertyType.SALE}>Venda</option>
                      <option value={PropertyType.RENTAL_ANNUAL}>Locação Anual</option>
                      <option value={PropertyType.RENTAL_SEASONAL}>Locação Temporada</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                    <input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                 </div>

                 <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quartos</label>
                        <input
                          name="bedrooms"
                          type="number"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banheiros</label>
                        <input
                          name="bathrooms"
                          type="number"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Área (m²)</label>
                        <input
                          name="area"
                          type="number"
                          value={formData.area}
                          onChange={handleInputChange}
                          className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                 </div>
              </div>

              {/* Photos */}
              <div className="border-t border-slate-100 pt-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Fotos do Imóvel (Máx 10)</label>
                
                {/* Image Preview Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {displayImages.map((imgSrc, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                            <img src={imgSrc} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {/* Indicar se é pendente de upload (local) ou já salva (remota) */}
                            {index >= (formData.images?.length || 0) && (
                                <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    Novo
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {displayImages.length < 10 && (
                        <label className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition aspect-square">
                            <Upload className="text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500 font-medium">Adicionar</span>
                            <span className="text-xs text-slate-400">Máx 10MB</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handleImageUpload}
                                ref={fileInputRef}
                            />
                        </label>
                    )}
                </div>
              </div>

              {/* Description & AI */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Descrição</label>
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGenerating}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full flex items-center space-x-1 hover:bg-purple-200 transition disabled:opacity-50"
                    >
                        <Sparkles size={12} />
                        <span>{isGenerating ? 'Gerando IA...' : 'Gerar com IA'}</span>
                    </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva os detalhes do imóvel..."
                />
              </div>
              
              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Destaques (Ex: Piscina, Churrasqueira)</label>
                <div className="flex space-x-2 mb-3">
                  <input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-1 bg-white text-slate-900 border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adicionar destaque"
                  />
                  <button onClick={handleAddFeature} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features?.map(feat => (
                    <span key={feat} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center">
                      {feat}
                      <button onClick={() => removeFeature(feat)} className="ml-2 text-slate-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-70 flex items-center space-x-2"
                >
                  {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Salvando...</span>
                      </>
                  ) : (
                      <span>{isEditing ? 'Atualizar Imóvel' : 'Salvar Imóvel'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};