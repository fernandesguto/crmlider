import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType } from '../types';
import { Plus, Trash2, MapPin, BedDouble, Bath, Square, Sparkles } from 'lucide-react';
import { generatePropertyDescription } from '../services/geminiService';

export const Properties: React.FC = () => {
  const { properties, addProperty, deleteProperty, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/600` // Random image for demo
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      imageUrl: formData.imageUrl!,
      features: formData.features || [],
      brokerId: currentUser.id
    };
    addProperty(newProperty);
    setShowForm(false);
    // Reset form
    setFormData({
      title: '', type: PropertyType.SALE, price: 0, address: '', bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '',
      imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/600`
    });
  };

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
            <h2 className="text-2xl font-bold mb-6">Cadastrar Imóvel</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Título do Anúncio</label>
                   <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2" placeholder="Ex: Apartamento Vista Mar" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                   <select name="type" value={formData.type} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2">
                     <option value={PropertyType.SALE}>{PropertyType.SALE}</option>
                     <option value={PropertyType.RENTAL_ANNUAL}>{PropertyType.RENTAL_ANNUAL}</option>
                     <option value={PropertyType.RENTAL_SEASONAL}>{PropertyType.RENTAL_SEASONAL}</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                   <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                   <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div className="grid grid-cols-3 col-span-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Quartos</label>
                     <input required type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Banheiros</label>
                     <input required type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Área (m²)</label>
                     <input required type="number" name="area" value={formData.area} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2" />
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
                     className="w-full border border-slate-300 rounded-lg p-2 h-24"
                     placeholder="Clique em 'Gerar com IA' para uma descrição automática..."
                   />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar Imóvel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {properties.map(property => (
          <div key={property.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
            <div className="h-48 relative">
              <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide text-slate-800 shadow-sm">
                {property.type}
              </div>
              <button
                onClick={() => deleteProperty(property.id)}
                className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-1 truncate">{property.title}</h3>
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
      </div>
    </div>
  );
};
