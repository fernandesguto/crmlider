
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Upload, Loader2, Palette, Moon, Sun, Save, MapPin, Phone } from 'lucide-react';
import { uploadImage } from '../services/db';

export const Settings: React.FC = () => {
  const { currentAgency, updateAgency, currentUser, themeColor, setThemeColor, darkMode, setDarkMode } = useApp();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Local state for agency details
  const [agencyName, setAgencyName] = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  useEffect(() => {
      if (currentAgency) {
          setAgencyName(currentAgency.name || '');
          setAgencyAddress(currentAgency.address || '');
          setAgencyPhone(currentAgency.phone || '');
      }
  }, [currentAgency]);

  const colors = [
    { name: 'Azul', value: '#3b82f6' }, // Blue
    { name: 'Vermelho', value: '#ef4444' }, // Red
    { name: 'Verde', value: '#22c55e' }, // Green
    { name: 'Roxo', value: '#a855f7' }, // Purple
    { name: 'Laranja', value: '#f97316' }, // Orange
    { name: 'Rosa', value: '#ec4899' }, // Pink
    { name: 'Indigo', value: '#6366f1' }, // Indigo
    { name: 'Teal', value: '#14b8a6' }, // Teal
    { name: 'Ciano', value: '#06b6d4' }, // Cyan
    { name: 'Esmeralda', value: '#10b981' }, // Emerald
    { name: 'Ambar', value: '#f59e0b' }, // Amber
    { name: 'Lima', value: '#84cc16' }, // Lime
    { name: 'Fucsia', value: '#d946ef' }, // Fuchsia
    { name: 'Rose', value: '#f43f5e' }, // Rose
    { name: 'Ardósia', value: '#64748b' }, // Slate
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentAgency) return;

      if (file.size > 10 * 1024 * 1024) {
          alert('A imagem é muito grande. O limite máximo é 10MB.');
          e.target.value = ''; // Reset input
          return;
      }

      setUploadingLogo(true);
      try {
          const url = await uploadImage(file);
          if (url) {
              await updateAgency({ ...currentAgency, logoUrl: url });
          } else {
              alert('Erro ao fazer upload da imagem.');
          }
      } catch (error) {
          console.error(error);
          alert('Erro ao atualizar logo.');
      } finally {
          setUploadingLogo(false);
      }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentAgency) return;
      
      setIsSavingDetails(true);
      try {
          await updateAgency({
              ...currentAgency,
              name: agencyName,
              address: agencyAddress,
              phone: agencyPhone
          });
          alert('Informações atualizadas com sucesso!');
      } catch (error) {
          alert('Erro ao salvar informações.');
      } finally {
          setIsSavingDetails(false);
      }
  };

  if (currentUser?.role !== 'Admin') {
      return (
          <div className="p-8 h-screen flex items-center justify-center text-slate-500">
              <p>Acesso restrito a administradores.</p>
          </div>
      )
  }

  return (
    <div className="p-8 h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Configurações</h1>
        <p className="text-slate-500 mb-8">Personalize a identidade e o visual do sistema</p>

        <div className="space-y-8 max-w-4xl">
            {/* Seção Identidade */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Building2 className="mr-2 text-blue-600" size={24} />
                    Identidade da Imobiliária
                </h2>
                
                <div className="flex flex-col md:flex-row items-start space-y-8 md:space-y-0 md:space-x-8">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-40 h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0 group mb-4">
                            {currentAgency?.logoUrl ? (
                                <img src={currentAgency.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building2 className="text-slate-300" size={48} />
                            )}
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                </div>
                            )}
                        </div>
                        <label className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition text-sm font-medium inline-flex items-center shadow-sm w-full justify-center ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload size={16} className="mr-2"/>
                            {currentAgency?.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleLogoUpload} 
                                disabled={uploadingLogo}
                            />
                        </label>
                        <span className="text-xs text-slate-400 mt-2">Máx 10MB</span>
                    </div>

                    {/* Form Details */}
                    <form onSubmit={handleSaveDetails} className="flex-1 w-full space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Imobiliária</label>
                            <input 
                                value={agencyName}
                                onChange={e => setAgencyName(e.target.value)}
                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nome da empresa"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Endereço Principal</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    value={agencyAddress}
                                    onChange={e => setAgencyAddress(e.target.value)}
                                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg pl-10 p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Av. Principal, 1000 - Centro, Cidade - UF"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp Principal</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    value={agencyPhone}
                                    onChange={e => setAgencyPhone(e.target.value)}
                                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg pl-10 p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-2 text-right">
                            <button 
                                type="submit" 
                                disabled={isSavingDetails}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition disabled:opacity-70 flex items-center justify-center ml-auto"
                            >
                                {isSavingDetails ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                Salvar Informações
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Seção Aparência */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Palette className="mr-2 text-purple-600" size={24} />
                    Aparência do Sistema
                </h2>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Modo de Exibição</h3>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setDarkMode(false)}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition ${!darkMode ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                            <Sun size={20} />
                            <span className="font-medium">Modo Claro</span>
                        </button>
                        <button 
                            onClick={() => setDarkMode(true)}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition ${darkMode ? 'border-blue-600 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                            <Moon size={20} />
                            <span className="font-medium">Modo Escuro</span>
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Cor do Tema</h3>
                    <p className="text-sm text-slate-500 mb-4">Escolha a cor principal para botões, links e destaques.</p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {colors.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => setThemeColor(color.value)}
                                className={`h-12 rounded-lg flex items-center justify-center transition border-2 ${themeColor === color.value ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            >
                                {themeColor === color.value && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
