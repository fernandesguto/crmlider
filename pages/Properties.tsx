import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyType, LeadStatus } from '../types';
import { Plus, Trash2, MapPin, BedDouble, Bath, Square, ImageIcon, ArrowLeft, User, Phone, Edit, X, ChevronLeft, ChevronRight, ShieldCheck, FileText, CheckCircle, DollarSign, RotateCcw, Search, Filter, Key, Sparkles, Loader2, Check, ChevronDown, Star, FileDown, ArrowUpDown, LayoutGrid, List, MessageCircle, Calendar, Users } from 'lucide-react';
import { uploadImage } from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';
import { generatePropertyDescription } from '../services/geminiService';
import jsPDF from "jspdf";

export const Properties: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, markPropertyAsSold, reactivateProperty, getNextPropertyCode, currentUser, leads, users, currentAgency, updateLeadInterestStatus } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedDescription, setHasGeneratedDescription] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [previewCode, setPreviewCode] = useState<number>(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [selectedBuyerLead, setSelectedBuyerLead] = useState<string>('');
  const [selectedSellingBroker, setSelectedSellingBroker] = useState<string>('');
  const [saleType, setSaleType] = useState<'internal' | 'external'>('internal');
  
  const [finalSalePrice, setFinalSalePrice] = useState<number>(0);
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionPercent, setCommissionPercent] = useState<string>('6'); 
  const [commissionFixed, setCommissionFixed] = useState<number>(0);
  const [calculatedCommission, setCalculatedCommission] = useState<number>(0);

  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');

  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fix: Rename setSearchTerm to setSearchText to align with calls elsewhere in the file
  const [searchText, setSearchText] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('');
  const [bathroomsFilter, setBathroomsFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('date_desc');

  // Estado para adicionar lead nos detalhes
  const [isAddingLeadInDetails, setIsAddingLeadInDetails] = useState(false);
  const [leadInDetailsSearch, setLeadInDetailsSearch] = useState('');

  const [formData, setFormData] = useState<Partial<Property>>({
    title: '', type: PropertyType.SALE, category: 'Residencial', subtype: 'Casa', price: 0,
    address: '', neighborhood: '', city: '', state: '', ownerName: '', ownerPhone: '', internalNotes: '',
    bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '', images: [], status: 'Active'
  });
  
  const [pendingFiles, setPendingFiles] = useState<{file: File, preview: string}[]>([]);
  const [newFeature, setNewFeature] = useState('');

  const parseCurrency = (value: string) => Number(value.replace(/\D/g, "")) / 100;
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const allFeatures = Array.from(new Set(properties.flatMap(p => p.features || []))).sort();
  const allCities = Array.from(new Set(properties.map(p => p.city || '').filter(c => c !== ''))).sort();

  interface ImageInfo {
      base64: string;
      width: number;
      height: number;
      ratio: number;
  }

  const getDataUrl = (url: string, type = 'image/jpeg'): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const quality = type === 'image/jpeg' ? 0.7 : undefined;
                resolve({
                    base64: canvas.toDataURL(type, quality),
                    width: img.width,
                    height: img.height,
                    ratio: img.width / img.height
                });
            } else {
                reject(new Error('Canvas context failed'));
            }
        };
        img.onerror = (e) => reject(e);
    });
  };

  const generatePDF = async () => {
      if (!selectedProperty) return;
      setIsGeneratingPdf(true);
      const broker = users.find(u => u.id === selectedProperty.brokerId);
      try {
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 10;
          const contentWidth = pageWidth - (margin * 2);
          let yPos = margin;
          if (currentAgency?.logoUrl) {
              try {
                  const logoData = await getDataUrl(currentAgency.logoUrl, 'image/png');
                  const maxLogoW = 40;
                  const maxLogoH = 20;
                  let drawW = maxLogoW;
                  let drawH = drawW / logoData.ratio;
                  if (drawH > maxLogoH) {
                      drawH = maxLogoH;
                      drawW = drawH * logoData.ratio;
                  }
                  doc.addImage(logoData.base64, 'PNG', margin, yPos, drawW, drawH);
              } catch (e) {
                  doc.setFontSize(14);
                  doc.setFont('helvetica', 'bold');
                  doc.text(currentAgency.name || "Imobiliária", margin, yPos + 10);
              }
          } else {
              doc.setFontSize(18);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(30, 64, 175);
              doc.text(currentAgency?.name || "Imobiliária", margin, yPos + 10);
          }
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          const contactInfo = [
              currentAgency?.phone || '',
              currentAgency?.address || '',
              users.find(u => u.role === 'Admin')?.email || ''
          ].filter(Boolean);
          let rightY = yPos + 5;
          contactInfo.forEach(info => {
              doc.text(info, pageWidth - margin, rightY, { align: 'right' });
              rightY += 4;
          });
          yPos += 25;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          const colGap = 5;
          const leftColWidth = (contentWidth * 0.5) - (colGap / 2);
          const rightColWidth = (contentWidth * 0.5) - (colGap / 2);
          if (selectedProperty.images && selectedProperty.images.length > 0) {
              try {
                  const coverImage = await getDataUrl(selectedProperty.images[0], 'image/jpeg');
                  const imgHeight = 60;
                  doc.addImage(coverImage.base64, 'JPEG', margin, yPos, leftColWidth, imgHeight, undefined, 'FAST');
                  doc.setFillColor(37, 99, 235);
                  doc.rect(margin, yPos + imgHeight - 8, 30, 8, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(8);
                  doc.setFont('helvetica', 'bold');
                  doc.text(selectedProperty.type.toUpperCase(), margin + 15, yPos + imgHeight - 3, { align: 'center' });
              } catch (e) {
                  doc.setFillColor(240, 240, 240);
                  doc.rect(margin, yPos, leftColWidth, 60, 'F');
              }
          }
          const rightColX = margin + leftColWidth + colGap;
          let textY = yPos + 5;
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          const titleLines = doc.splitTextToSize(selectedProperty.title, rightColWidth);
          doc.text(titleLines, rightColX, textY);
          textY += (titleLines.length * 6) + 2;
          doc.setFontSize(18);
          doc.setTextColor(37, 99, 235);
          doc.text(formatCurrency(selectedProperty.price), rightColX, textY);
          textY += 8;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'bold');
          doc.text(`Cód: #${selectedProperty.code}`, rightColX, textY);
          textY += 6;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          const addressLines = doc.splitTextToSize(`${selectedProperty.neighborhood}, ${selectedProperty.city} - ${selectedProperty.state}`, rightColWidth);
          doc.text(addressLines, rightColX, textY);
          textY += (addressLines.length * 5) + 5;
          const statsY = textY;
          const statWidth = rightColWidth / 3;
          doc.setFillColor(248, 250, 252);
          doc.rect(rightColX, statsY, rightColWidth, 15, 'F');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'bold');
          const iconY = statsY + 6;
          const valY = statsY + 11;
          doc.setFontSize(8);
          doc.text("QUARTOS", rightColX + (statWidth * 0.5), iconY, { align: 'center' });
          doc.text("BANHEIROS", rightColX + (statWidth * 1.5), iconY, { align: 'center' });
          doc.text("ÁREA", rightColX + (statWidth * 2.5), iconY, { align: 'center' });
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(selectedProperty.bedrooms.toString(), rightColX + (statWidth * 0.5), valY, { align: 'center' });
          doc.text(selectedProperty.bathrooms.toString(), rightColX + (statWidth * 1.5), valY, { align: 'center' });
          doc.text(`${selectedProperty.area}m²`, rightColX + (statWidth * 2.5), valY, { align: 'center' });
          yPos = Math.max(yPos + 60, textY + 20) + 10;
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text("Sobre o Imóvel", margin, yPos);
          yPos += 5;
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(selectedProperty.description || "Sem descrição.", contentWidth);
          const maxDescLines = 15;
          const displayLines = doc.splitTextToSize(selectedProperty.description || "Sem descrição.", contentWidth).slice(0, maxDescLines);
          doc.text(displayLines, margin, yPos);
          yPos += (displayLines.length * 4) + 8;
          if (selectedProperty.features && selectedProperty.features.length > 0) {
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'bold');
              doc.text("Diferenciais", margin, yPos);
              yPos += 5;
              doc.setFontSize(9);
              doc.setTextColor(60, 60, 60);
              doc.setFont('helvetica', 'normal');
              const featuresText = selectedProperty.features.join('  •  ');
              const featLines = doc.splitTextToSize(featuresText, contentWidth);
              doc.text(featLines, margin, yPos);
              yPos += (featLines.length * 4) + 8;
          }
          if (selectedProperty.images && selectedProperty.images.length > 1) {
              const galleryImages = selectedProperty.images.slice(1);
              const footerHeight = 30;
              const remainingHeight = pageHeight - yPos - footerHeight - margin;
              if (remainingHeight > 40) {
                  doc.setFontSize(11);
                  doc.setTextColor(0, 0, 0);
                  doc.setFont('helvetica', 'bold');
                  doc.text("Galeria", margin, yPos);
                  yPos += 5;
                  const thumbW = 45;
                  const thumbH = 30;
                  const gap = 3;
                  let currentX = margin;
                  for (let i = 0; i < galleryImages.length; i++) {
                      if (currentX + thumbW > pageWidth - margin) {
                          currentX = margin;
                          yPos += thumbH + gap;
                      }
                      if (yPos + thumbH > pageHeight - footerHeight - margin) break;
                      try {
                          const thumbData = await getDataUrl(galleryImages[i], 'image/jpeg');
                          doc.addImage(thumbData.base64, 'JPEG', currentX, yPos, thumbW, thumbH, undefined, 'FAST');
                      } catch (e) {
                          doc.setFillColor(230, 230, 230);
                          doc.rect(currentX, yPos, thumbW, thumbH, 'F');
                      }
                      currentX += thumbW + gap;
                  }
                  yPos += thumbH + 10;
              }
          }
          const footerY = pageHeight - 25; 
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, footerY, pageWidth - margin, footerY);
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text("Responsável:", margin, footerY + 5);
          if (broker) {
              doc.setFont('helvetica', 'bold');
              doc.text(broker.name, margin + 25, footerY + 5);
              doc.setFont('helvetica', 'normal');
              const brokerContact = [broker.email, broker.phone].filter(Boolean).join('  |  ');
              doc.text(brokerContact, margin, footerY + 10);
          }
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Gerado em ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY + 10, { align: 'right' });
          doc.save(`${selectedProperty.title} - ${selectedProperty.code}.pdf`);
      } catch (error) {
          console.error("Erro ao gerar PDF:", error);
          alert("Erro ao gerar o PDF. Tente novamente.");
      } finally {
          setIsGeneratingPdf(false);
      }
  };

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
          const matchFeature = selectedFeatures.length === 0 || selectedFeatures.every(f => property.features && property.features.includes(f));
          const matchCategory = !categoryFilter || property.category === categoryFilter;
          const matchSubtype = !subtypeFilter || property.subtype === subtypeFilter;
          const matchCity = !cityFilter || property.city === cityFilter;
          const matchBedrooms = !bedroomsFilter || property.bedrooms >= Number(bedroomsFilter);
          const matchBathrooms = !bathroomsFilter || property.bathrooms >= Number(bathroomsFilter);
          return matchText && matchMinPrice && matchMaxPrice && matchType && matchFeature && 
                 matchCategory && matchSubtype && matchCity && matchBedrooms && matchBathrooms;
      })
      .sort((a, b) => {
          switch (sortOption) {
              case 'price_asc': return a.price - b.price;
              case 'price_desc': return b.price - a.price;
              case 'date_asc': return (a.code || 0) - (b.code || 0);
              case 'date_desc':
                  if (a.status === 'Active' && b.status !== 'Active') return -1;
                  if (a.status !== 'Active' && b.status === 'Active') return 1;
                  return (b.code || 0) - (a.code || 0);
              default:
                  if (a.status === 'Active' && b.status !== 'Active') return -1;
                  if (a.status !== 'Active' && b.status === 'Active') return 1;
                  return (b.code || 0) - (a.code || 0);
          }
      });

  const clearFilters = () => {
      // Fix: Used setSearchText correctly
      setSearchText(''); setPriceMin(''); setPriceMax(''); setTypeFilter(''); setSelectedFeatures([]); setCategoryFilter(''); setSubtypeFilter(''); setCityFilter(''); setBedroomsFilter(''); setBathroomsFilter(''); setSortOption('date_desc');
  };

  const addFeatureFilter = (feature: string) => { if (feature && !selectedFeatures.includes(feature)) setSelectedFeatures([...selectedFeatures, feature]); };
  const removeFeatureFilter = (feature: string) => setSelectedFeatures(selectedFeatures.filter(f => f !== feature));

  const openLightbox = (index: number) => { setCurrentImageIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextImage = (e?: React.MouseEvent) => { e?.stopPropagation(); if (selectedProperty?.images && selectedProperty.images.length > 0) setCurrentImageIndex((prev) => (prev + 1) % selectedProperty.images.length); };
  const prevImage = (e?: React.MouseEvent) => { e?.stopPropagation(); if (selectedProperty?.images && selectedProperty.images.length > 0) setCurrentImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (!lightboxOpen) return; if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowRight') nextImage(); if (e.key === 'ArrowLeft') prevImage(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedProperty]);

  const scrollThumbnails = (direction: 'left' | 'right') => { if (thumbnailsRef.current) { const scrollAmount = 300; thumbnailsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' }); } };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleAddFeature = (e: React.FormEvent) => { e.preventDefault(); if (newFeature && !formData.features?.includes(newFeature)) { setFormData(prev => ({ ...prev, features: [...(prev.features || []), newFeature] })); setNewFeature(''); } };
  const removeFeature = (feat: string) => { setFormData(prev => ({ ...prev, features: prev.features?.filter(f => f !== feat) })); };

  const handleGenerateDescription = async () => {
      if (hasGeneratedDescription) return;
      if (!formData.title || !formData.type) { alert("Por favor, preencha pelo menos o Título e o Tipo do imóvel antes de gerar a descrição."); return; }
      setIsGenerating(true);
      try {
          const description = await generatePropertyDescription(formData.title, formData.type as PropertyType, formData.features || [], Number(formData.area || 0), Number(formData.bedrooms || 0));
          setFormData(prev => ({ ...prev, description }));
          setHasGeneratedDescription(true);
      } catch (error) { alert("Erro ao gerar descrição. Verifique sua conexão."); } finally { setIsGenerating(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentCount = (formData.images?.length || 0) + pendingFiles.length;
      if (currentCount + files.length > 10) { alert('Você só pode adicionar até 10 fotos no total.'); return; }
      const newPending: {file: File, preview: string}[] = [];
      const MAX_SIZE = 10 * 1024 * 1024;
      for (let i = 0; i < Array.from(files).length; i++) {
          const file = files[i];
          if (file.size > MAX_SIZE) { alert(`A imagem "${file.name}" excede o limite de 10MB.`); continue; }
          const preview = URL.createObjectURL(file);
          newPending.push({ file, preview });
      }
      setPendingFiles(prev => [...prev, ...newPending]);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
      const existingCount = formData.images?.length || 0;
      if (indexToRemove < existingCount) setFormData(prev => ({ ...prev, images: prev.images?.filter((_, index) => index !== indexToRemove) }));
      else { const localIndex = indexToRemove - existingCount; setPendingFiles(prev => prev.filter((_, index) => index !== localIndex)); }
  };

  const setAsCover = (index: number) => {
      const existingCount = formData.images?.length || 0;
      if (index < existingCount) {
          const newImages = [...(formData.images || [])];
          const [item] = newImages.splice(index, 1);
          newImages.unshift(item);
          setFormData(prev => ({ ...prev, images: newImages }));
      } else {
          const localIndex = index - existingCount;
          const newPending = [...pendingFiles];
          const [item] = newPending.splice(localIndex, 1);
          newPending.unshift(item);
          setPendingFiles(newPending);
      }
  };

  const handleOpenCreate = () => { resetForm(); setPreviewCode(getNextPropertyCode()); setShowForm(true); };
  const handleOpenEdit = (property: Property) => { setFormData({ ...property, images: property.images || [] }); setPreviewCode(property.code || 0); setPendingFiles([]); setIsEditing(true); setEditingId(property.id); setHasGeneratedDescription(false); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const uploadedUrls: string[] = [];
        for (const pf of pendingFiles) { const url = await uploadImage(pf.file); if (url) uploadedUrls.push(url); }
        const finalImages = [...(formData.images || []), ...uploadedUrls];
        if (finalImages.length === 0) finalImages.push(`https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/600`);
        const propertyData = { ...formData, price: Number(formData.price), bedrooms: Number(formData.bedrooms), bathrooms: Number(formData.bathrooms), area: Number(formData.area), images: finalImages, brokerId: (isEditing && formData.brokerId) ? formData.brokerId : (currentUser?.id || ''), agencyId: (isEditing && formData.agencyId) ? formData.agencyId : (currentAgency?.id || ''), status: (formData.status || 'Active') as 'Active' | 'Sold' } as Property;
        if (isEditing && editingId) { await updateProperty({ ...propertyData, id: editingId, code: previewCode }); if (selectedProperty && selectedProperty.id === editingId) setSelectedProperty(propertyData); }
        else { await addProperty({ ...propertyData, id: Date.now().toString() }); }
        setShowForm(false); resetForm();
    } catch (error: any) { alert(`Erro ao salvar imóvel: ${error.message}`); } finally { setIsSaving(false); }
  };

  const isRental = (type: string) => type.includes('Locação');
  const handleOpenSoldModal = () => {
      setSaleType('internal'); setSelectedBuyerLead(''); setSelectedSellingBroker(currentUser?.id || '');
      const initialPrice = selectedProperty?.price || 0;
      setFinalSalePrice(initialPrice); setCommissionType('percent'); setCommissionPercent('6'); setCommissionFixed(0);
      const today = new Date().toISOString().split('T')[0];
      setRentalStartDate(today);
      const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
      setRentalEndDate(nextYear.toISOString().split('T')[0]);
      if (selectedProperty && isRental(selectedProperty.type)) { setCommissionFixed(initialPrice); setCommissionType('fixed'); }
      setCalculatedCommission(0); setSoldModalOpen(true);
  };

  useEffect(() => {
      const price = finalSalePrice;
      if (commissionType === 'percent') {
          const percent = parseFloat(commissionPercent);
          if (!isNaN(price) && !isNaN(percent)) setCalculatedCommission(price * (percent / 100));
          else setCalculatedCommission(0);
      } else setCalculatedCommission(commissionFixed);
  }, [finalSalePrice, commissionPercent, commissionFixed, commissionType]);

  const handleConfirmSold = async () => {
      if (selectedProperty) {
          try {
              if (saleType === 'internal' && !selectedBuyerLead) { alert("Selecione o Lead."); return; }
              if (saleType === 'internal' && !selectedSellingBroker) { alert("Selecione o Corretor Vendedor."); return; }
              if (isRental(selectedProperty.type) && (!rentalStartDate || !rentalEndDate)) { alert("Preencha as datas de início e fim do contrato."); return; }
              const leadId = saleType === 'internal' ? selectedBuyerLead : null;
              const soldBy = saleType === 'internal' ? selectedSellingBroker : undefined;
              const saleVal = saleType === 'internal' ? finalSalePrice : 0;
              const commVal = saleType === 'internal' ? calculatedCommission : 0;
              const startDate = isRental(selectedProperty.type) ? rentalStartDate : undefined;
              const endDate = isRental(selectedProperty.type) ? rentalEndDate : undefined;
              await markPropertyAsSold(selectedProperty.id, leadId, saleVal, commVal, soldBy, startDate, endDate);
              setSelectedProperty(prev => prev ? ({ ...prev, status: 'Sold', soldToLeadId: leadId || undefined, soldByUserId: soldBy, salePrice: saleVal, commissionValue: commVal }) : null);
              setSoldModalOpen(false);
          } catch (error) { alert("Erro ao marcar como fechado."); }
      }
  };

  const handleConfirmReactivate = async () => {
      if (selectedProperty) {
          try {
              await reactivateProperty(selectedProperty.id);
              setSelectedProperty(prev => prev ? ({...prev, status: 'Active', soldAt: undefined, soldToLeadId: undefined, soldByUserId: undefined, salePrice: undefined, commissionValue: undefined}) : null);
              setReactivateModalOpen(false);
          } catch (error) { alert("Erro ao reativar."); }
      }
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); setPropertyToDelete(id); setDeleteModalOpen(true); };
  const confirmDelete = async () => { if (propertyToDelete) { await deleteProperty(propertyToDelete); if (selectedProperty && selectedProperty.id === propertyToDelete) setSelectedProperty(null); } setPropertyToDelete(null); };

  const resetForm = () => {
    setFormData({ title: '', type: PropertyType.SALE, category: 'Residencial', subtype: 'Casa', price: 0, address: '', neighborhood: '', city: '', state: '', ownerName: '', ownerPhone: '', internalNotes: '', bedrooms: 1, bathrooms: 1, area: 50, features: [], description: '', images: [], status: 'Active' });
    setPendingFiles([]); setIsEditing(false); setEditingId(null); setHasGeneratedDescription(false);
  };

  const getBrokerName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';
  const getInterestedLeads = (propId: string) => leads.filter(l => (l.interestedInPropertyIds || []).includes(propId));
  const formatCode = (code?: number) => code ? `#${code.toString().padStart(5, '0')}` : '#00000';
  const displayImages = [...(formData.images || []), ...pendingFiles.map(p => p.preview)];

  const getInterestStatus = (leadId: string, propertyId: string) => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return LeadStatus.NEW;
      const interest = lead.interests?.find(i => i.propertyId === propertyId);
      if (interest) return interest.status;
      return lead.status;
  };

  const getStatusStyle = (status: string) => {
        switch (status) {
            case LeadStatus.NEW: return 'bg-green-100 text-green-700 border-green-200';
            case LeadStatus.CONTACTED: return 'bg-blue-50 text-blue-700 border-blue-200';
            case LeadStatus.VISITING: return 'bg-purple-50 text-purple-700 border-purple-200';
            case LeadStatus.NEGOTIATION: return 'bg-orange-50 text-orange-700 border-orange-200';
            case LeadStatus.CLOSED: return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case LeadStatus.LOST: return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
  };

  const handleLinkLeadInDetails = async (leadId: string) => {
      if (!selectedProperty) return;
      await updateLeadInterestStatus(leadId, selectedProperty.id, LeadStatus.NEW);
      setIsAddingLeadInDetails(false);
      setLeadInDetailsSearch('');
  };

  const renderForm = () => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto my-8 animate-in fade-in duration-300">
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                {isEditing ? <Edit className="mr-2 text-blue-600" size={24}/> : <Plus className="mr-2 text-blue-600" size={24}/>}
                {isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
                <span className="ml-3 text-xs md:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono hidden md:inline-block">
                    Código: {formatCode(previewCode)}
                </span>
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Título do Anúncio</label><input name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Apartamento Vista Mar" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Negócio</label><select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">{Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">{formData.type?.includes('Locação') ? 'Valor do Aluguel (R$)' : 'Valor de Venda (R$)'}</label><input type="text" name="price" required value={formatCurrency(Number(formData.price))} onChange={(e) => { const val = parseCurrency(e.target.value); setFormData(prev => ({ ...prev, price: val })); }} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">{['Residencial', 'Comercial', 'Industrial'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Subtipo</label><select name="subtype" value={formData.subtype} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">{['Casa', 'Apartamento', 'Sala', 'Loja', 'Prédio', 'Galpão', 'Terreno', 'Chácara'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Endereço (Rua/Av e Número)</label><input name="address" required value={formData.address} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rua das Flores, 123" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Bairro</label><input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label><input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Estado (UF)</label><input name="state" maxLength={2} value={formData.state} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="SP" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Quartos</label><input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Banheiros</label><input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Área (m²)</label><input type="number" name="area" value={formData.area} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
            </div>
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 mb-6">
                <h3 className="text-sm font-bold text-amber-800 uppercase mb-4 flex items-center"><ShieldCheck size={16} className="mr-2"/> Dados Privados (Não aparecem no site)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-amber-900 mb-1">Nome do Proprietário</label><input name="ownerName" value={formData.ownerName} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500" /></div>
                    <div><label className="block text-sm font-bold text-amber-900 mb-1">Telefone do Proprietário</label><input name="ownerPhone" value={formData.ownerPhone} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-amber-900 mb-1">Observações Internas</label><textarea name="internalNotes" rows={2} value={formData.internalNotes} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500" /></div>
                </div>
            </div>
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição do Imóvel</label>
                <div className="relative">
                    <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva os detalhes do imóvel..." />
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || hasGeneratedDescription} className={`absolute right-2 bottom-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:shadow-md transition ${hasGeneratedDescription ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-blue-600'}`}>
                        {isGenerating ? <Loader2 size={12} className="animate-spin mr-1" /> : hasGeneratedDescription ? <Check size={12} className="mr-1"/> : <Sparkles size={12} className="mr-1" />}
                        {hasGeneratedDescription ? 'Gerada' : (isGenerating ? 'Gerando...' : 'Gerar com IA')}
                    </button>
                </div>
            </div>
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Fotos do Imóvel (Máx 10)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {displayImages.map((src, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={src} alt={`Foto ${index}`} className="w-full h-full object-cover rounded-lg border border-slate-200" />
                            {index !== 0 && <button type="button" onClick={() => setAsCover(index)} className="absolute top-1 left-1 bg-black/50 hover:bg-yellow-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm" title="Definir como Capa"><Star size={14} /></button>}
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"><X size={14} /></button>
                            {index === 0 && <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center"><Star size={10} className="mr-1 text-yellow-400 fill-yellow-400"/> Capa</span>}
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
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-70 shadow-lg shadow-blue-500/30">{isSaving ? 'Salvando...' : (isEditing ? 'Atualizar Imóvel' : 'Cadastrar Imóvel')}</button>
            </div>
        </form>
    </div>
  );

  if (selectedProperty) {
    if (showForm) return <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">{renderForm()}</div>;
    const interestedLeads = getInterestedLeads(selectedProperty.id);
    const isRentalProperty = isRental(selectedProperty.type);

    const availableLeadsToLink = leads.filter(l => 
        !(l.interestedInPropertyIds || []).includes(selectedProperty.id) &&
        (l.name.toLowerCase().includes(leadInDetailsSearch.toLowerCase()) || 
         l.phone.includes(leadInDetailsSearch))
    ).slice(0, 5);

    return (
      <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedProperty(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition flex-shrink-0"><ArrowLeft size={20} /></button>
            <div>
                <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
                    {selectedProperty.title}
                    <span className="text-xs md:text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap">{formatCode(selectedProperty.code)}</span>
                    {selectedProperty.status === 'Sold' && (
                        <div className="flex flex-col md:flex-row gap-2">
                            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap text-center">{isRentalProperty ? 'Locado' : 'Vendido'}</span>
                            {!selectedProperty.soldToLeadId && <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap border border-slate-600 text-center">Outra Imobiliária</span>}
                        </div>
                    )}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1 flex flex-wrap items-center"><span className="font-semibold">{selectedProperty.category}</span><span className="mx-2">/</span><span className="font-semibold">{selectedProperty.subtype || 'Casa'}</span><span className="mx-2">•</span>{selectedProperty.type}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1.5 flex items-center"><MapPin size={14} className="mr-1.5 text-slate-400 flex-shrink-0" />{selectedProperty.address} - {selectedProperty.neighborhood}, {selectedProperty.city} - {selectedProperty.state}</p>
            </div>
          </div>
          <div className="flex space-x-2 w-full md:w-auto">
            {selectedProperty.status === 'Sold' ? <button onClick={() => setReactivateModalOpen(true)} className="flex-1 md:flex-none bg-amber-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-600 transition"><RotateCcw size={18} /><span>Reativar Anúncio</span></button> : <button onClick={handleOpenSoldModal} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition">{isRentalProperty ? <Key size={18} /> : <DollarSign size={18} />}<span>{isRentalProperty ? 'Marcar como Locado' : 'Marcar como Vendido'}</span></button>}
            <button onClick={() => handleOpenEdit(selectedProperty)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition"><Edit size={18} /><span className="hidden md:inline">Editar</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="h-64 md:h-96 relative group cursor-pointer bg-slate-100" onClick={() => openLightbox(0)}><img src={selectedProperty.images?.[0]} className="w-full h-full object-cover" alt=""/><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center"><ImageIcon size={18} className="mr-2"/> Ver Galeria</span></div></div>
                    {selectedProperty.images && selectedProperty.images.length > 1 && (
                        <div className="relative border-b border-slate-100 bg-slate-50/50 group">
                            <button onClick={() => scrollThumbnails('left')} className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-slate-100 to-transparent w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-slate-200/50"><ChevronLeft size={24} className="text-slate-600" /></button>
                            <div ref={thumbnailsRef} className="flex p-4 gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>{selectedProperty.images.map((img, idx) => (<img key={idx} src={img} onClick={() => openLightbox(idx)} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition hover:ring-2 hover:ring-blue-500 flex-shrink-0 snap-center" alt="" />))}</div>
                            <button onClick={() => scrollThumbnails('right')} className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-slate-100 to-transparent w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-slate-200/50"><ChevronRight size={24} className="text-slate-600" /></button>
                        </div>
                    )}
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-slate-100 gap-6">
                            <div className="grid grid-cols-3 gap-8 md:gap-12 w-full md:w-auto">
                                <div className="text-center"><div className="flex items-center justify-center text-blue-600 mb-1"><BedDouble size={24} className="md:w-7 md:h-7" /></div><p className="text-xl md:text-2xl font-bold text-slate-800">{selectedProperty.bedrooms}</p><p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">Quartos</p></div>
                                <div className="text-center"><div className="flex items-center justify-center text-blue-600 mb-1"><Bath size={24} className="md:w-7 md:h-7" /></div><p className="text-xl md:text-2xl font-bold text-slate-800">{selectedProperty.bathrooms}</p><p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">Banheiros</p></div>
                                <div className="text-center"><div className="flex items-center justify-center text-blue-600 mb-1"><Square size={24} className="md:w-7 md:h-7" /></div><p className="text-xl md:text-2xl font-bold text-slate-800">{selectedProperty.area}</p><p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">m² Área</p></div>
                            </div>
                            <div className="text-center md:text-right w-full md:w-auto"><p className="text-sm text-slate-500 mb-1">{isRentalProperty ? 'Valor Aluguel' : 'Valor Venda'}</p><p className="text-3xl md:text-4xl font-bold text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.price)}</p></div>
                        </div>
                        <div className="mb-8"><h3 className="text-lg font-bold text-slate-800 mb-3">Sobre o imóvel</h3><p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">{selectedProperty.description}</p></div>
                        {selectedProperty.features && selectedProperty.features.length > 0 && <div className="mb-8"><h3 className="text-lg font-bold text-slate-800 mb-3">Diferenciais</h3><div className="flex flex-wrap gap-2">{selectedProperty.features.map(feat => (<span key={feat} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium border border-slate-200 flex items-center"><CheckCircle size={14} className="mr-1.5 text-blue-500"/> {feat}</span>))}</div></div>}
                        <div className="bg-amber-50 rounded-lg p-5 border border-amber-100"><h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide flex items-center mb-4"><ShieldCheck size={16} className="mr-2" /> Informações Internas</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><p className="text-xs text-amber-600/70 font-semibold uppercase mb-1">Proprietário</p><div className="flex items-center space-x-2 text-amber-900 font-medium"><User size={16} className="opacity-50" /><span>{selectedProperty.ownerName || 'Não informado'}</span></div>{selectedProperty.ownerPhone && (<div className="flex items-center space-x-2 text-amber-900 mt-1"><Phone size={16} className="opacity-50" /><span>{selectedProperty.ownerPhone}</span></div>)}</div><div><p className="text-xs text-amber-600/70 font-semibold uppercase mb-1">Observações Privadas</p><div className="flex items-start space-x-2 text-amber-900 text-sm"><FileText size={16} className="opacity-50 mt-0.5 flex-shrink-0" /><p>{selectedProperty.internalNotes || 'Nenhuma.'}</p></div></div></div></div>
                        {selectedProperty.status === 'Sold' && (selectedProperty.salePrice || 0) > 0 && (<div className="mt-6 bg-green-50 rounded-lg p-5 border border-green-100"><h3 className="text-sm font-bold text-green-800 uppercase tracking-wide flex items-center mb-4"><DollarSign size={16} className="mr-2" /> Dados do Fechamento</h3><div className="grid grid-cols-2 gap-6"><div><p className="text-xs text-green-600/70 font-semibold uppercase mb-1">{isRentalProperty ? 'Valor do Contrato' : 'Valor da Venda'}</p><p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.salePrice || 0)}</p></div><div><p className="text-xs text-green-600/70 font-semibold uppercase mb-1">Comissão Gerada</p><p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.commissionValue || 0)}</p></div></div><div className="mt-4 pt-4 border-t border-green-200"><p className="text-xs text-green-600/70 font-semibold uppercase mb-1">Vendedor</p><p className="text-green-800 font-medium flex items-center"><User size={14} className="mr-1"/> {getBrokerName(selectedProperty.soldByUserId || '')}</p></div></div>)}
                        {selectedProperty.status === 'Sold' && (!selectedProperty.salePrice || selectedProperty.salePrice === 0) && (<div className="mt-6 bg-slate-100 rounded-lg p-5 border border-slate-200"><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4"><DollarSign size={16} className="mr-2" /> Dados do Fechamento</h3><p className="text-sm text-slate-600">Marcado como vendido externamente (Outra Imobiliária).</p></div>)}
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Corretor Responsável</h3><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={24} /></div><div><p className="font-bold text-slate-800 text-lg">{getBrokerName(selectedProperty.brokerId)}</p><p className="text-slate-500 text-sm">Captador</p></div></div><button onClick={generatePDF} disabled={isGeneratingPdf} className="w-full flex items-center justify-center space-x-2 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold py-3 px-4 rounded-lg transition mt-6 disabled:opacity-50">{isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}<span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar Ficha em PDF'}</span></button><div className="mt-4 pt-4 border-t border-slate-100 flex justify-between"><button onClick={(e) => handleDeleteClick(selectedProperty.id, e)} className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /><span>Excluir Imóvel</span></button></div></div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center"><MessageCircle className="mr-2 text-blue-500" size={20} />Leads Interessados ({interestedLeads.length})</h3>
                        <button 
                            onClick={() => { setIsAddingLeadInDetails(!isAddingLeadInDetails); setLeadInDetailsSearch(''); }}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-full transition bg-blue-50 border border-blue-100"
                            title="Vincular Lead Interessado"
                        >
                            {isAddingLeadInDetails ? <X size={18}/> : <Plus size={18} />}
                        </button>
                    </div>
                    
                    {isAddingLeadInDetails && (
                        <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top duration-200">
                            <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5 tracking-wider">Vincular Cliente ao Imóvel</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 text-blue-400" size={14} />
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Buscar lead por nome ou tel..." 
                                    value={leadInDetailsSearch}
                                    onChange={(e) => setLeadInDetailsSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {leadInDetailsSearch && (
                                <div className="mt-2 bg-white border border-blue-100 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {availableLeadsToLink.map(lead => (
                                        <button 
                                            key={lead.id} 
                                            onClick={() => handleLinkLeadInDetails(lead.id)}
                                            className="w-full text-left p-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center justify-between group transition"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{lead.name}</p>
                                                <p className="text-[10px] text-slate-500">{lead.phone}</p>
                                            </div>
                                            <Plus size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition"/>
                                        </button>
                                    ))}
                                    {availableLeadsToLink.length === 0 && <p className="p-3 text-center text-xs text-slate-400 italic">Nenhum lead compatível.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="overflow-y-auto flex-1 p-2">
                        {interestedLeads.map(lead => {
                            const status = getInterestStatus(lead.id, selectedProperty.id);
                            return (
                                <div key={lead.id} className="bg-white border border-slate-100 rounded-lg p-3 mb-2 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-slate-800">{lead.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center space-x-1 border border-green-200 transition">
                                            <Phone size={12} /> <span>WhatsApp</span>
                                        </a>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <select 
                                            value={status}
                                            onChange={(e) => updateLeadInterestStatus(lead.id, selectedProperty.id, e.target.value as LeadStatus)}
                                            className={`text-[10px] font-bold px-2 py-1 rounded border outline-none transition w-full ${getStatusStyle(status)}`}
                                        >
                                            {Object.values(LeadStatus).map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )
                        })}
                        {interestedLeads.length === 0 && !isAddingLeadInDetails && <p className="text-center text-slate-400 text-sm mt-10">Nenhum lead marcou interesse ainda.</p>}
                    </div>
                </div>
            </div>
        </div>
        <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Imóvel" message="Tem certeza?" confirmText="Excluir" isDestructive />
        <ConfirmModal isOpen={reactivateModalOpen} onClose={() => setReactivateModalOpen(false)} onConfirm={handleConfirmReactivate} title="Reativar Imóvel" message="Deseja colocar este imóvel à venda novamente?" confirmText="Reativar" isDestructive={false} />
        {soldModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-slate-800">{isRental(selectedProperty.type) ? 'Fechar Locação' : 'Fechar Venda'}</h2><button onClick={() => setSoldModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
                    <div className="space-y-5">
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">{isRental(selectedProperty.type) ? 'Quem alugou este imóvel?' : 'Quem comprou este imóvel?'}</label><div className="space-y-3"><label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 bg-white"><input type="radio" name="saleType" checked={saleType === 'internal'} onChange={() => setSaleType('internal')} className="w-4 h-4 text-blue-600"/><span className="font-medium text-slate-800">Cliente da Imobiliária (Lead)</span></label>{saleType === 'internal' && (<div className="ml-7 space-y-3"><div><label className="block text-xs font-bold text-slate-500 mb-1">Cliente (Lead)</label><select className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm bg-white" value={selectedBuyerLead} onChange={(e) => setSelectedBuyerLead(e.target.value)}><option value="">Selecione o Lead...</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Corretor Vendedor</label><select className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm bg-white" value={selectedSellingBroker} onChange={(e) => setSelectedSellingBroker(e.target.value)}><option value="">Selecione quem vendeu...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div></div>)}<label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 bg-white"><input type="radio" name="saleType" checked={saleType === 'external'} onChange={() => setSaleType('external')} className="w-4 h-4 text-blue-600"/><div><span className="block font-medium text-slate-800">Venda Externa / Outra Imobiliária</span><span className="text-xs text-slate-500">Apenas marca como vendido no sistema</span></div></label></div></div>
                        {isRental(selectedProperty.type) && (<div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><label className="block text-sm font-bold text-blue-800 mb-2 flex items-center"><Calendar size={16} className="mr-1.5"/> Período do Contrato</label><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-blue-700 mb-1">Início</label><input type="date" value={rentalStartDate} onChange={e => setRentalStartDate(e.target.value)} className="w-full bg-white border border-blue-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/></div><div><label className="block text-xs font-bold text-blue-700 mb-1">Fim</label><input type="date" value={rentalEndDate} onChange={e => setRentalEndDate(e.target.value)} className="w-full bg-white border border-blue-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/></div></div><p className="text-[10px] text-blue-600 mt-2 italic">* O sistema criará um alerta automático 7 dias antes do vencimento.</p></div>)}
                        {saleType === 'internal' && (<div><label className="block text-sm font-bold text-slate-700 mb-1">{isRental(selectedProperty.type) ? 'Valor do Aluguel (R$)' : 'Valor Final da Venda (R$)'}</label><input type="text" value={formatCurrency(finalSalePrice)} onChange={e => setFinalSalePrice(parseCurrency(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-500 font-semibold text-slate-900" /></div>)}
                        {saleType === 'internal' && (<div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className="block text-sm font-bold text-slate-700 mb-2">Comissão / Agenciamento</label><div className="flex gap-2 mb-2"><button type="button" onClick={() => setCommissionType('percent')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${commissionType === 'percent' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>Porcentagem (%)</button><button type="button" onClick={() => setCommissionType('fixed')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${commissionType === 'fixed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>Valor Fixo (R$)</button></div><div className="flex items-center gap-3">{commissionType === 'percent' ? (<input type="number" value={commissionPercent} onChange={e => setCommissionPercent(e.target.value)} className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-900" placeholder="6"/>) : (<input type="text" value={formatCurrency(commissionFixed)} onChange={e => setCommissionFixed(parseCurrency(e.target.value))} className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-900"/>)}<div className="text-right flex-1"><p className="text-xs text-slate-500 uppercase font-bold">Valor a Receber</p><p className="text-xl font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedCommission)}</p></div></div></div>)}
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100"><button onClick={() => setSoldModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button><button onClick={handleConfirmSold} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center"><CheckCircle size={18} className="mr-2"/> Confirmar</button></div>
                </div>
            </div>
        )}
        {lightboxOpen && (
            <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4"><button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:text-slate-300"><X size={32}/></button><button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-4"><ChevronLeft size={48}/></button><div className="max-w-7xl max-h-[90vh]"><img src={selectedProperty.images?.[currentImageIndex]} className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm" alt=""/><div className="absolute bottom-4 left-0 right-0 text-center text-white/80 font-medium">{currentImageIndex + 1} / {selectedProperty.images?.length}</div></div><button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-4"><ChevronRight size={48}/></button></div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-screen overflow-y-auto">
        {!showForm ? (
            <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div><h1 className="text-2xl md:text-3xl font-bold text-slate-800">Imóveis</h1></div>
                    <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition w-full md:w-auto justify-center"><Plus size={20} /><span>Cadastrar Imóvel</span></button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase text-xs tracking-wider">
                            <Filter size={14} /> <span>Filtros Avançados</span>
                        </div>
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Visualizar em Grade"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Visualizar em Lista"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1"><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Nome, Endereço, Código..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div></div>
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cidade</label><select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Todas</option>{allCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Negócio</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Todas</option>{Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Todas</option>{['Residencial', 'Comercial', 'Industrial'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subtipo</label><select value={subtypeFilter} onChange={(e) => setSubtypeFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Todos</option>{['Casa', 'Apartamento', 'Sala', 'Loja', 'Prédio', 'Galpão', 'Terreno', 'Chácara'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Mín</label><input type="text" placeholder="R$ 0,00" value={priceMin ? formatCurrency(Number(priceMin)) : ''} onChange={(e) => { const val = parseCurrency(e.target.value); setPriceMin(val ? val.toString() : ''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Máx</label><input type="text" placeholder="R$ Max" value={priceMax ? formatCurrency(Number(priceMax)) : ''} onChange={(e) => { const val = parseCurrency(e.target.value); setPriceMax(val ? val.toString() : ''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div></div>
                        <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quartos</label><input type="number" min="0" placeholder="Min" value={bedroomsFilter} onChange={(e) => setBedroomsFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Banheiros</label><input type="number" min="0" placeholder="Min" value={bathroomsFilter} onChange={(e) => setBathroomsFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div></div>
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Diferenciais (Múltiplos)</label><select onChange={(e) => { addFeatureFilter(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">+ Adicionar filtro...</option>{allFeatures.filter(f => !selectedFeatures.includes(f)).map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center"><ArrowUpDown size={12} className="mr-1"/> Ordenar Por</label><select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"><option value="date_desc">Mais Recentes</option><option value="date_asc">Mais Antigos</option><option value="price_asc">Menor Preço</option><option value="price_desc">Maior Preço</option></select></div>
                    </div>
                    {selectedFeatures.length > 0 && <div className="flex flex-wrap gap-2 mb-2 px-1">{selectedFeatures.map(feat => (<span key={feat} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center font-medium border border-blue-200">{feat}<button onClick={() => removeFeatureFilter(feat)} className="ml-2 hover:text-red-500"><X size={12}/></button></span>))}</div>}
                    {(searchText || priceMin || priceMax || typeFilter || selectedFeatures.length > 0 || categoryFilter || subtypeFilter || cityFilter || bedroomsFilter || bathroomsFilter) && (<div className="flex justify-end border-t border-slate-100 pt-3"><button onClick={clearFilters} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-medium text-sm flex items-center"><X size={14} className="mr-1" /> Limpar Filtros</button></div>)}
                    <div className="mt-2 text-right text-xs text-slate-400">{filteredProperties.length} imóveis encontrados</div>
                </div>

                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8" 
                    : "flex flex-col gap-4 pb-8"
                }>
                    {filteredProperties.map(property => {
                        const propertyInterestedLeads = leads.filter(l => (l.interestedInPropertyIds || []).includes(property.id));
                        return (
                        <div 
                            key={property.id} 
                            className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition duration-200 cursor-pointer group ${property.status === 'Sold' ? 'opacity-75' : ''} ${viewMode === 'list' ? 'flex flex-row' : ''}`} 
                            onClick={() => setSelectedProperty(property)}
                        >
                            <div className={`${viewMode === 'list' ? 'w-48 h-auto flex-shrink-0' : 'h-48'} overflow-hidden relative`}>
                                <img src={property.images?.[0] || 'https://via.placeholder.com/400'} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute top-0 right-0 bg-white/90 px-2 py-1 rounded-bl-lg text-[10px] font-bold font-mono border-l border-b border-slate-200 shadow-sm text-slate-800">{formatCode(property.code)}</div>
                                {property.status === 'Sold' && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-4 text-center"><span className={`bg-red-600 text-white text-xs font-bold px-4 py-1 rounded shadow-lg transform -rotate-12 uppercase border-2 border-white mb-2 tracking-wider`}>{isRental(property.type) ? 'Locado' : 'Vendido'}</span>{!property.soldToLeadId && <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transform -rotate-12 border border-white/50">Outra Imobiliária</span>}</div>)}
                                <div className="absolute bottom-2 left-2 flex gap-1"><span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">{property.type}</span><span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{property.subtype}</span></div>
                            </div>
                            <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
                                <h3 className={`font-bold text-slate-800 ${viewMode === 'list' ? 'text-lg mb-1' : 'text-sm mb-1 line-clamp-1'}`}>{property.title}</h3>
                                <p className="text-slate-500 text-[10px] mb-2 flex items-center"><MapPin size={10} className="mr-1"/> {property.address}</p>
                                <div className={`flex items-center justify-between text-slate-600 text-[10px] ${viewMode === 'list' ? 'mb-2 border-y border-slate-50 py-2' : 'mb-3'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center"><BedDouble size={12} className="mr-1 text-blue-400"/> {property.bedrooms}</span>
                                        <span className="flex items-center"><Bath size={12} className="mr-1 text-blue-400"/> {property.bathrooms}</span>
                                        <span className="flex items-center"><Square size={12} className="mr-1 text-blue-400"/> {property.area}m²</span>
                                    </div>
                                </div>

                                {viewMode === 'list' && (
                                    <div className="mb-3">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Clientes Interessados:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {propertyInterestedLeads.map(lead => {
                                                const status = getInterestStatus(lead.id, property.id);
                                                return (
                                                    <div key={lead.id} className={`flex items-center text-[9px] px-2 py-0.5 rounded-full border font-bold ${getStatusStyle(status)}`}>
                                                        <User size={8} className="mr-1" />
                                                        <span className="opacity-80 mr-1 truncate max-w-[100px]">{lead.name}</span>
                                                        <span className="flex-shrink-0 text-[8px] opacity-90 tracking-tighter">({status})</span>
                                                    </div>
                                                )
                                            })}
                                            {propertyInterestedLeads.length === 0 && (
                                                <span className="text-[9px] text-slate-400 font-medium italic">Nenhum interessado ainda</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`pt-2 border-t border-slate-100 flex justify-between items-center ${viewMode === 'list' ? 'border-none p-0' : ''}`}>
                                    <p className={`font-bold text-blue-600 ${viewMode === 'list' ? 'text-xl' : 'text-base'}`}>{formatCurrency(property.price)}</p>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
                
                <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Imóvel" message="Tem certeza?" confirmText="Excluir" isDestructive />
            </>
        ) : renderForm()}
    </div>
  );
};