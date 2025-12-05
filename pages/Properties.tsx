import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType, LeadStatus } from '../types';
import { Plus, Trash2, MapPin, BedDouble, Bath, Square, Sparkles, Upload, Image as ImageIcon, ArrowLeft, User, Phone, Mail, MessageCircle } from 'lucide-react';
import { generatePropertyDescription } from '../services/geminiService';
import { uploadImage } from '../services/db';

export const Properties: React.FC = () => {
  const { properties, addProperty, deleteProperty, currentUser, leads, users, currentAgency } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Guardar o arquivo real para upload
  const [imageFile, setImageFile] = useState<File | null>(null);

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
    imageUrl: '' 
  });

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        let finalImageUrl = formData.imageUrl;

        if (imageFile) {
            const uploadedUrl = await uploadImage(imageFile);
            if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
            }
        } else if (!finalImageUrl) {
            finalImageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/600`;
        }

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
          imageUrl: finalImageUrl!,
          features: formData.features || [],
          brokerId: currentUser.id,
          agencyId: currentAgency?.id || ''
        };

        await addProperty(newProperty);
        setShowForm(false);
        setFormData({
          title: '', type: PropertyType.SALE, price: 0, address: '', bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '',
          imageUrl: ''
        });
        setImageFile(null);
    } catch (error) {
        alert("Erro ao salvar imóvel. Verifique a conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  const getBrokerName = (id: string) => {
    return users.find(u => u.id === id)?.name || 'Desconhecido';
  };

  const getInterestedLeads = (propId: string) => {
    return leads.filter(l => l.interestedInPropertyIds.includes(propId));
  };

  // --- DETAIL VIEW ---
  if (selectedProperty) {
    const interestedLeads = getInterestedLeads(selectedProperty.id);

    return (
      <div className="p-8 h-screen overflow-y-auto bg-slate-50">
        {/* Header Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => setSelectedProperty(null)}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Detalhes do Imóvel</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left Column: Images & Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="h-96 relative">
                 <img src={selectedProperty.imageUrl} alt={selectedProperty.title} className="w-full h-full object-cover" />
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
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                        <MessageCircle size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">Nenhum lead demonstrou interesse neste imóvel ainda.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW (Original) ---
  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Imóveis</h1>
           <p className="text-slate-500">Gerencie seu portfólio de vendas e locações</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
        >
          <Plus size={20} />
          <span>Novo Imóvel</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Cadastrar Imóvel</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Título do Anúncio</label>
                   <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2" placeholder="Ex: Apartamento Vista Mar" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                   <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2">
                     <option value={PropertyType.SALE}>{PropertyType.SALE}</option>
                     <option value={PropertyType.RENTAL_ANNUAL}>{PropertyType.RENTAL_ANNUAL}</option>
                     <option value={PropertyType.RENTAL_SEASONAL}>{PropertyType.RENTAL_SEASONAL}</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                   <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2" />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                   <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2" />
                </div>
                <div className="grid grid-cols-3 col-span-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Quartos</label>
                     <input required type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Banheiros</label>
                     <input required type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Área (m²)</label>
                     <input required type="number" name="area" value={formData.area} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2" />
                   </div>
                </div>
                
                {/* Image Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Foto Principal</label>
                  <div 
                    className="border-2 border-dashed border-slate-300 bg-white rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.imageUrl ? (
                      <div className="relative w-full h-48">
                         <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                         <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition">
                            <span className="flex items-center space-x-2"><Upload size={20} /> <span>Trocar Foto</span></span>
                         </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <ImageIcon size={48} className="mx-auto mb-2" />
                        <p>Clique para enviar uma foto</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>

                {/* Features Input */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Características</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            value={newFeature} 
                            onChange={(e) => setNewFeature(e.target.value)} 
                            className="flex-1 bg-white text-slate-900 border border-slate-300 rounded-lg p-2"
                            placeholder="Ex: Piscina, Churrasqueira..."
                            onKeyDown={(e) => { if(e.key === 'Enter') handleAddFeature(e) }}
                        />
                        <button type="button" onClick={handleAddFeature} className="bg-slate-200 text-slate-700 px-3 rounded-lg hover:bg-slate-300">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.features?.map(feat => (
                            <span key={feat} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm flex items-center">
                                {feat}
                                <button type="button" onClick={() => removeFeature(feat)} className="ml-1 hover:text-red-500">×</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="col-span-2">
                   <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-medium text-slate-700">Descrição</label>
                     <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGenerating}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center space-x-1 hover:bg-purple-200 transition"
                      >
                        <Sparkles size={12} />
                        <span>{isGenerating ? 'Gerando...' : 'Gerar com IA'}</span>
                      </button>
                   </div>
                   <textarea
                     name="description"
                     value={formData.description}
                     onChange={handleInputChange}
                     className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 h-24"
                     placeholder="Clique em 'Gerar com IA' para uma descrição automática..."
                   />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                   {isSaving ? 'Salvando...' : 'Salvar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {properties.map(property => (
          <div 
            key={property.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition cursor-pointer group"
            onClick={() => setSelectedProperty(property)}
          >
            <div className="h-48 relative">
              <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide text-slate-800 shadow-sm">
                {property.type}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-1 truncate group-hover:text-blue-600 transition">{property.title}</h3>
              <div className="flex items-center text-slate-500 text-sm mb-3">
                <MapPin size={14} className="mr-1" />
                <span className="truncate">{property.address}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-sm mb-4 bg-slate-50 p-2 rounded-lg">
                 <div className="flex items-center space-x-1"><BedDouble size={16} /> <span>{property.bedrooms}</span></div>
                 <div className="flex items-center space-x-1"><Bath size={16} /> <span>{property.bathrooms}</span></div>
                 <div className="flex items-center space-x-1"><Square size={16} /> <span>{property.area}m²</span></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                  {property.type !== PropertyType.SALE && <span className="text-sm font-normal text-slate-500">/mês/dia</span>}
                </span>
              </div>
            </div>
          </div>
        ))}
        {properties.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-slate-500 mb-4">Nenhum imóvel cadastrado.</p>
                <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">
                    Cadastre o primeiro imóvel
                </button>
            </div>
        )}
      </div>
    </div>
  );
};