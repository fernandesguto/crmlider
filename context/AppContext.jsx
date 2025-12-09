import React, { createContext, useContext, useState, useEffect } from 'react';
import * as DB from '../services/db';
import { LeadStatus } from '../types';

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
    // Global State
    const [currentUser, setCurrentUser] = useState(null);
    const [currentAgency, setCurrentAgency] = useState(null);
    const [currentView, setCurrentView] = useState('LANDING');
    const [isLoading, setIsLoading] = useState(true);
    
    // Data State
    const [properties, setProperties] = useState([]);
    const [leads, setLeads] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);

    // Theme
    const [themeColor, setThemeColor] = useState('#3b82f6');
    const [darkMode, setDarkMode] = useState(false);

    // Notifications
    const [notificationTask, setNotificationTask] = useState(null);
    const [notificationLead, setNotificationLead] = useState(null);

    // Auth Initialization
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            
            const savedColor = localStorage.getItem('imob_theme_color');
            const savedDark = localStorage.getItem('imob_dark_mode');
            if (savedColor) setThemeColor(savedColor);
            if (savedDark) setDarkMode(savedDark === 'true');

            const savedUserId = localStorage.getItem('imob_user_id');
            if (savedUserId) {
                try {
                    const users = await DB.getAll('users', { column: 'id', value: savedUserId });
                    if (users && users.length > 0) {
                        const user = users[0];
                        setCurrentUser(user);
                        
                        const agencies = await DB.getAll('agencies', { column: 'id', value: user.agencyId });
                        if (agencies && agencies.length > 0) {
                            setCurrentAgency(agencies[0]);
                            setCurrentView('DASHBOARD');
                        }
                    } else {
                        localStorage.removeItem('imob_user_id');
                    }
                } catch (error) {
                    console.error("Auth init error", error);
                }
            }
            setIsLoading(false);
        };
        
        DB.seedDatabase().then(() => initAuth());
    }, []);

    useEffect(() => {
        localStorage.setItem('imob_theme_color', themeColor);
        localStorage.setItem('imob_dark_mode', String(darkMode));
    }, [themeColor, darkMode]);

    useEffect(() => {
        if (!currentUser || !currentAgency) return;

        const loadData = async () => {
            const agencyId = currentAgency.id;
            
            const props = await DB.getAll('properties', { column: 'agencyId', value: agencyId });
            setProperties(props || []);

            const lds = await DB.getAll('leads', { column: 'agencyId', value: agencyId });
            setLeads(lds || []);

            const tsks = await DB.getAll('tasks', { column: 'agencyId', value: agencyId });
            setTasks(tsks || []);

            const usrs = await DB.getAll('users', { column: 'agencyId', value: agencyId });
            setUsers(usrs || []);
        };

        loadData();
    }, [currentUser, currentAgency]);

    // Polling for New Leads
    useEffect(() => {
        if (!currentUser || !currentAgency) return;

        const interval = setInterval(async () => {
            const now = new Date();
            const thirtySecondsAgo = new Date(now.getTime() - 30000);
            
            try {
                const latestLeads = await DB.getAll('leads', { column: 'agencyId', value: currentAgency.id });
                
                if (latestLeads.length > leads.length) {
                    const newLead = latestLeads.find(l => new Date(l.createdAt) > thirtySecondsAgo);
                    if (newLead) {
                        setNotificationLead(newLead);
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        audio.play().catch(e => console.log('Audio play failed', e));
                    }
                    setLeads(latestLeads);
                }
            } catch (e) {
                // silent fail
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [currentUser, currentAgency, leads]);

    // --- ACTIONS ---

    const login = async (email, password) => {
        try {
            const users = await DB.getAll('users', { column: 'email', value: email });
            const user = users.find(u => u.password === password || u.password === undefined); 
            
            if (user) {
                const agencies = await DB.getAll('agencies', { column: 'id', value: user.agencyId });
                
                if (!agencies || agencies.length === 0) {
                    return { success: false, message: 'Agência não encontrada.' };
                }

                const agency = agencies[0];

                if (!agency.isApproved) {
                    if (agency.trialExpiresAt) {
                        const today = new Date();
                        const expiration = new Date(agency.trialExpiresAt);
                        
                        if (today > expiration) {
                            return { success: false, message: 'Período de teste expirado. Entre em contato para liberar o acesso.' };
                        }
                    } else {
                        return { success: false, message: 'Seu cadastro está em análise. Aguarde a aprovação do administrador.' };
                    }
                }

                localStorage.setItem('imob_user_id', user.id);
                setCurrentUser(user);
                setCurrentAgency(agency);
                setCurrentView('DASHBOARD');
                
                await DB.updateItem('users', { ...user, loginCount: (user.loginCount || 0) + 1 });
                
                return { success: true };
            }
            return { success: false, message: 'Email ou senha inválidos.' };
        } catch (e) {
            return { success: false, message: 'Erro de conexão.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('imob_user_id');
        setCurrentUser(null);
        setCurrentAgency(null);
        setCurrentView('LANDING');
        setProperties([]);
        setLeads([]);
        setTasks([]);
        setUsers([]);
        window.location.reload();
    };

    const registerAgency = async (agencyName, adminName, email, phone, password) => {
        try {
            const existingUsers = await DB.getAll('users', { column: 'email', value: email });
            if (existingUsers.length > 0) {
                return { success: false, message: 'Este e-mail já está em uso.' };
            }

            const agencyId = uuid();
            const userId = uuid();

            const trialDate = new Date();
            trialDate.setDate(trialDate.getDate() + 3);

            const newAgency = {
                id: agencyId,
                name: agencyName,
                createdAt: new Date().toISOString(),
                isApproved: false,
                trialExpiresAt: trialDate.toISOString(),
                phone: phone
            };
            
            const newAdmin = {
                id: userId,
                name: adminName,
                email,
                password,
                phone,
                role: 'Admin',
                agencyId,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`,
                loginCount: 0
            };

            await DB.addItem('agencies', newAgency);
            await DB.addItem('users', newAdmin);

            return { success: true, message: 'Conta criada! Você tem 3 dias de teste grátis liberados. Faça login para começar.' };
        } catch (e) {
             if (e.code === '23505') return { success: false, message: 'Este e-mail já está cadastrado.' };
             return { success: false, message: e.message || 'Erro ao criar conta.' };
        }
    };

    const addProperty = async (property) => {
        const nextCode = getNextPropertyCode();
        const propertyWithCode = { ...property, code: nextCode };
        
        const saved = await DB.addItem('properties', propertyWithCode);
        setProperties(prev => [...prev, saved]);
    };

    const updateProperty = async (property) => {
        await DB.updateItem('properties', property);
        setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    };

    const deleteProperty = async (id) => {
        try {
            const propertyToDelete = properties.find(p => p.id === id);
            await DB.deleteItem('properties', id);
            setProperties(prev => prev.filter(p => p.id !== id));
            if (propertyToDelete && propertyToDelete.images && propertyToDelete.images.length > 0) {
                DB.deleteStorageImages(propertyToDelete.images);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const markPropertyAsSold = async (id, leadId, salePrice, commission, soldByUserId) => {
        const update = {
            id,
            status: 'Sold',
            soldAt: new Date().toISOString(),
            soldToLeadId: leadId,
            soldByUserId,
            salePrice,
            commissionValue: commission
        };
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
        
        if (leadId) {
            updateLeadStatus(leadId, LeadStatus.CLOSED);
        }
    };

    const reactivateProperty = async (id) => {
        const update = {
            id,
            status: 'Active',
            soldAt: null,
            soldToLeadId: null,
            soldByUserId: null,
            salePrice: null,
            commissionValue: null
        };
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'Active', soldAt: undefined, soldToLeadId: undefined, soldByUserId: undefined, salePrice: undefined, commissionValue: undefined } : p));
    };

    const readjustRental = async (id, newRent, newComm, date) => {
        const prop = properties.find(p => p.id === id);
        const oldRent = prop?.salePrice || 0;
        const oldComm = prop?.commissionValue || 0;
        
        const note = `\n[Reajuste em ${new Date(date).toLocaleDateString()}]: Aluguel de R$${oldRent} para R$${newRent}. Comissão de R$${oldComm} para R$${newComm}.`;
        const currentNotes = prop?.internalNotes || '';

        const update = { 
            id, 
            salePrice: newRent, 
            commissionValue: newComm,
            internalNotes: currentNotes + note
        };
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, salePrice: newRent, commissionValue: newComm, internalNotes: (p.internalNotes || '') + note } : p));
    };

    const getNextPropertyCode = () => {
        if (properties.length === 0) return 1;
        const max = Math.max(...properties.map(p => p.code || 0));
        return max + 1;
    };

    const addLead = async (lead) => {
        const saved = await DB.addItem('leads', lead);
        setLeads(prev => [saved, ...prev]);
        setNotificationLead(saved);
    };

    const updateLead = async (lead) => {
        await DB.updateItem('leads', lead);
        setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    };

    const updateLeadStatus = async (id, status) => {
        await DB.updateItem('leads', { id, status });
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    const deleteLead = async (id) => {
        try {
            await DB.deleteItem('leads', id);
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

    const addTask = async (task) => {
        const saved = await DB.addItem('tasks', task);
        setTasks(prev => [...prev, saved]);
        setNotificationTask(saved);
    };

    const updateTask = async (task) => {
        await DB.updateItem('tasks', task);
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const toggleTaskCompletion = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStatus = !task.completed;
            await DB.updateItem('tasks', { id, completed: newStatus });
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus } : t));
        }
    };

    const deleteTask = async (id) => {
        try {
            await DB.deleteItem('tasks', id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

    const createAgencyUser = async (userData) => {
        if (!currentAgency) return { success: false, message: 'Sem agência.' };
        try {
            const existingUsers = await DB.getAll('users', { column: 'email', value: userData.email });
            if (existingUsers && existingUsers.length > 0) {
                return { success: false, message: 'Este e-mail já está em uso.' };
            }

            const newUser = {
                id: uuid(),
                name: userData.name,
                email: userData.email,
                password: userData.password,
                phone: userData.phone,
                role: userData.role || 'Broker',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || '')}&background=random`,
                agencyId: currentAgency.id,
                loginCount: 0
            };
            const savedUser = await DB.addItem('users', newUser);
            setUsers(prev => [...prev, savedUser]);
            return { success: true };
        } catch (error) {
            if (error.code === '23505') return { success: false, message: 'Este e-mail já está em uso por outro usuário.' };
            return { success: false, message: error.message || 'Erro ao criar usuário.' };
        }
    };

    const updateUser = async (user) => {
        try {
            await DB.updateItem('users', user);
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            if (currentUser?.id === user.id) setCurrentUser(user);
            return { success: true };
        } catch (e) {
            if (e.code === '23505') return { success: false, message: 'Este e-mail já está em uso por outro usuário.' };
            return { success: false, message: e.message };
        }
    };

    const deleteUser = async (id) => {
        try {
            await DB.deleteItem('users', id);
            setUsers(prev => prev.filter(u => u.id !== id));
            return { success: true };
        } catch (e) {
            return { success: false, message: e.message };
        }
    };

    const updateAgency = async (agency) => {
        await DB.updateItem('agencies', agency);
        setCurrentAgency(agency);
    };

    const loadMessages = async (leadId) => {
        setMessages([]); 
    };

    const addMessage = async (msg) => {
        setMessages(prev => [...prev, msg]);
    };
    
    const dismissNotification = () => {
        setNotificationTask(null);
        setNotificationLead(null);
    };

    return (
        <AppContext.Provider value={{
            currentUser, currentAgency, properties, leads, tasks, users, messages,
            currentView, setCurrentView, isLoading,
            themeColor, setThemeColor, darkMode, setDarkMode,
            login, logout, registerAgency,
            setAgency: setCurrentAgency,
            addProperty, updateProperty, deleteProperty, markPropertyAsSold, reactivateProperty, readjustRental, getNextPropertyCode,
            addLead, updateLead, updateLeadStatus, deleteLead,
            addTask, updateTask, toggleTaskCompletion, deleteTask,
            createAgencyUser, updateUser, deleteUser,
            updateAgency,
            loadMessages, addMessage,
            notificationTask, notificationLead, dismissNotification,
            isSuperAdmin: currentUser?.email === 'fernandes_guto@hotmail.com'
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};