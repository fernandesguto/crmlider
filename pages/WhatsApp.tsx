
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Send, Plus, MoreVertical, Phone, User, Check, CheckCheck, Clock, MessageSquare } from 'lucide-react';
import { Lead, LeadStatus } from '../types';

export const WhatsApp: React.FC = () => {
  const { leads, addLead, messages, loadMessages, addMessage, currentAgency } = useApp();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State para adicionar novo lead "on the fly"
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadNumber, setNewLeadNumber] = useState('');
  const [newLeadName, setNewLeadName] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Filtra leads ordenando por quem tem msg mais recente (simulado aqui pela lista original ou ordem de criação)
  const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.phone.includes(searchTerm)
  );

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  useEffect(() => {
      if (selectedLeadId) {
          loadMessages(selectedLeadId);
      }
  }, [selectedLeadId]);

  useEffect(() => {
      // Scroll para o fim quando mensagens mudam
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [messages]);

  const handleSendMessage = async (openWhatsApp = true) => {
      if (!inputText.trim() || !selectedLead) return;

      const newMsg = {
          id: Date.now().toString(),
          content: inputText,
          direction: 'outbound' as const,
          leadId: selectedLead.id,
          createdAt: new Date().toISOString(),
          agencyId: currentAgency?.id || ''
      };

      await addMessage(newMsg);
      
      if (openWhatsApp) {
          const phone = selectedLead.phone.replace(/\D/g, '');
          const text = encodeURIComponent(inputText);
          window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
      }
      
      setInputText('');
  };

  const handleCreateLead = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLeadName || !newLeadNumber || !currentAgency) return;

      const newLead: Lead = {
          id: Date.now().toString(),
          name: newLeadName,
          email: '', // Pode preencher depois
          phone: newLeadNumber,
          type: 'Buyer',
          status: LeadStatus.NEW,
          interestedInPropertyIds: [],
          notes: 'Cadastrado via WhatsApp CRM',
          createdAt: new Date().toISOString(),
          agencyId: currentAgency.id
      };

      await addLead(newLead);
      setShowNewLeadModal(false);
      setSelectedLeadId(newLead.id);
      setNewLeadName('');
      setNewLeadNumber('');
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-700 text-lg">WhatsApp CRM</h2>
                <button 
                    onClick={() => setShowNewLeadModal(true)} 
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-sm" 
                    title="Nova Conversa / Lead"
                >
                    <Plus size={20} />
                </button>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar conversa..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {filteredLeads.map(lead => (
                <div 
                    key={lead.id} 
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition flex items-center space-x-3 ${selectedLeadId === lead.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                >
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 flex-shrink-0">
                        <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-semibold text-slate-800 truncate">{lead.name}</h3>
                            <span className="text-xs text-slate-400">{new Date(lead.createdAt).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}</span>
                        </div>
                        <p className="text-sm text-slate-500 truncate flex items-center">
                            {lead.phone}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#e5ddd5]">
        {selectedLead ? (
            <>
                <div className="h-16 bg-slate-100 border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-600">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">{selectedLead.name}</h2>
                            <p className="text-xs text-slate-500 flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${selectedLead.status === 'Novo' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                {selectedLead.status} • {selectedLead.phone}
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><Phone size={20} /></button>
                        <button className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><MoreVertical size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={chatContainerRef} style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat' }}>
                    {messages.length === 0 && (
                        <div className="flex justify-center mt-10">
                            <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg shadow text-sm text-center max-w-sm">
                                <p className="font-bold mb-1">Histórico Protegido</p>
                                <p>Esta conversa é um espelho do seu WhatsApp. As mensagens enviadas por aqui abrirão seu WhatsApp real.</p>
                            </div>
                        </div>
                    )}
                    
                    {messages.map(msg => {
                        const isOut = msg.direction === 'outbound';
                        return (
                            <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm relative ${isOut ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                    <p className="text-slate-800 text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className="flex justify-end items-center space-x-1 mt-1">
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isOut && <CheckCheck size={14} className="text-blue-500" />}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="bg-slate-100 p-4 border-t border-slate-200">
                    <div className="flex items-end space-x-2">
                        <div className="flex-1 bg-white rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                            <textarea 
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyPress={e => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(true);
                                    }
                                }}
                                placeholder="Digite uma mensagem..."
                                className="w-full p-3 h-12 max-h-32 outline-none resize-none text-sm text-slate-800"
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <button 
                                onClick={() => handleSendMessage(true)}
                                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition flex items-center justify-center"
                                title="Enviar e Abrir WhatsApp"
                            >
                                <Send size={20} className="ml-0.5" />
                            </button>
                            {inputText && (
                                <button 
                                    onClick={() => handleSendMessage(false)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 rounded-full shadow transition flex items-center justify-center"
                                    title="Apenas Salvar (Sem enviar)"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                        Pressione Enter para enviar. Use Shift+Enter para quebra de linha.
                    </p>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border-b-8 border-green-500 text-center p-8">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={48} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-light text-slate-600 mb-2">WhatsApp CRM</h2>
                <p className="text-slate-500 max-w-md">
                    Envie mensagens e mantenha o histórico das conversas com seus clientes organizado em um só lugar.
                </p>
                <div className="mt-8">
                    <p className="text-sm text-slate-400 mb-2">Recebeu uma mensagem de um desconhecido?</p>
                    <button 
                        onClick={() => setShowNewLeadModal(true)}
                        className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-green-700 transition"
                    >
                        Cadastrar Lead pelo Número
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Modal Novo Lead */}
      {showNewLeadModal && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Adicionar Lead do WhatsApp</h3>
                  <p className="text-sm text-slate-500 mb-6">Digite o número que entrou em contato para registrar como Lead.</p>
                  
                  <form onSubmit={handleCreateLead}>
                      <div className="mb-4">
                          <label className="block text-sm font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
                          <input 
                            required
                            value={newLeadNumber}
                            onChange={e => {
                                let val = e.target.value
                                    .replace(/\D/g, '')
                                    .replace(/^(\d{2})(\d)/, '($1) $2')
                                    .replace(/(\d)(\d{4})$/, '$1-$2');
                                setNewLeadNumber(val);
                            }}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
                          />
                      </div>
                      <div className="mb-6">
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Cliente</label>
                          <input 
                            required
                            value={newLeadName}
                            onChange={e => setNewLeadName(e.target.value)}
                            placeholder="Ex: Cliente Novo"
                            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500"
                          />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                          <button type="button" onClick={() => setShowNewLeadModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Cadastrar e Conversar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};