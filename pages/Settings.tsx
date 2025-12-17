
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Upload, Loader2, Palette, Moon, Sun, Save, MapPin, Phone, AlertCircle, Mail } from 'lucide-react';
import { uploadImage } from '../services/db';

export const Settings: React.FC = () => {
  const { currentAgency, updateAgency, currentUser, themeColor, setThemeColor, darkMode, setDarkMode } = useApp();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Local state for agency details
  const [agencyName, setAgencyName] = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');
  const [agencyCity, setAgencyCity] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  useEffect(() => {
      if (currentAgency) {
          setAgencyName(currentAgency.name || '');
          setAgencyAddress(currentAgency.address || '');
          setAgencyCity(currentAgency.city || '');
          setAgencyEmail(currentAgency.email || '');
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
              city: agencyCity,
              email: agencyEmail,
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
          <div className="p-8 h-screen flex flex-col items-center justify-center text-slate-500 bg-slate-50">
              <AlertCircle size={48} className="mb-4 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-700">Acesso Restrito</h2>
              <p>Apenas administradores podem acessar as configurações da agência.</p>
          </div>
      )
  }

  return (
    <div className="p-8 h-screen overflow-y-auto bg-slate-50">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Configurações</h1>
            <p className="text-slate-500">Personalize a identidade e o visual do sistema</p>
        </div>

        <div className="space-y-8 max-w-4xl pb-20">
            {/* Seção Identidade */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <Building2 className="mr-2 text-blue-600" size={24} />
                    Identidade da Imobiliária
                </h2>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-32 h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                            {currentAgency?.logoUrl ? (
                                <img src={currentAgency.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building2 size={40} className="text-slate-300" />
                            )}
                            
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                                {uploadingLogo ? (
                                    <Loader2 className="text-white animate-spin" />
                                ) : (
                                    <span className="text-white text-xs font-bold flex items-center"><Upload size={14} className="mr-1"/> Alterar</span>
                                )}
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 text-center">Recomendado: 200x200px<br/>PNG transparente</p>
                    </div>

                    {/* Detalhes Form */}
                    <form onSubmit={handleSaveDetails} className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
                                <input 
                                    required
                                    value={agencyName}
                                    onChange={e => setAgencyName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><Mail size={14} className="mr-1"/> E-mail Público (Site)</label>
                                <input 
                                    type="email"
                                    value={agencyEmail}
                                    onChange={e => setAgencyEmail(e.target.value)}
                                    placeholder="contato@imobiliaria.com.br"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><Phone size={14} className="mr-1"/> Telefone / WhatsApp</label>
                                <input 
                                    value={agencyPhone}
                                    onChange={e => {
                                        let val = e.target.value
                                            .replace(/\D/g, '')
                                            .replace(/^(\d{2})(\d)/, '($1) $2')
                                            .replace(/(\d)(\d{4})$/, '$1-$2');
                                        setAgencyPhone(val);
                                    }}
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><MapPin size={14} className="mr-1"/> Cidade</label>
                                <input 
                                    value={agencyCity}
                                    onChange={e => setAgencyCity(e.target.value)}
                                    placeholder="Cidade - UF"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><MapPin size={14} className="mr-1"/> Endereço Completo</label>
                            <input 
                                value={agencyAddress}
                                onChange={e => setAgencyAddress(e.target.value)}
                                placeholder="Rua, Número, Bairro"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSavingDetails}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition flex items-center disabled:opacity-70 shadow-sm"
                            >
                                {isSavingDetails ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                {isSavingDetails ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Seção Aparência */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <Palette className="mr-2 text-purple-600" size={24} />
                    Aparência do Sistema
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Cor Principal</label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setThemeColor(c.value)}
                                    className={`w-8 h-8 rounded-full transition hover:scale-110 focus:outline-none ring-2 ring-offset-2 ${themeColor === c.value ? 'ring-slate-400 scale-110' : 'ring-transparent'}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-3">Modo de Exibição</label>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setDarkMode(false)}
                                className={`flex items-center px-4 py-2 rounded-lg border transition ${!darkMode ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Sun size={18} className="mr-2" /> Claro
                            </button>
                            <button
                                onClick={() => setDarkMode(true)}
                                className={`flex items-center px-4 py-2 rounded-lg border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-white shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Moon size={18} className="mr-2" /> Escuro
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
