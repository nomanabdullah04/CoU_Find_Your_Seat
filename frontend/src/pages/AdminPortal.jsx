import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  LogOut,
  LayoutDashboard,
  UploadCloud,
  MapPin,
  Bell,
  ListOrdered,
  HelpCircle,
  Settings,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Plus,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Building,
  Check,
  X,
  Eye,
  EyeOff,
  Sliders,
  Phone,
  PhoneCall,
  LifeBuoy,
  Mail,
  FileText
} from 'lucide-react';
import {
  adminLogin,
  getAdminStats,
  downloadExcelTemplate,
  uploadSeatPlan,
  getAdminBatches,
  confirmBatchImport,
  rollbackBatch,
  getAdminCenters,
  createAdminCenter,
  updateAdminCenter,
  deleteAdminCenter,
  getAdminNotices,
  createAdminNotice,
  updateAdminNotice,
  deleteAdminNotice,
  getAdminSteps,
  createAdminStep,
  updateAdminStep,
  deleteAdminStep,
  getAdminFAQs,
  createAdminFAQ,
  updateAdminFAQ,
  deleteAdminFAQ,
  getAdminAssociations,
  createAdminAssociation,
  updateAdminAssociation,
  deleteAdminAssociation,
  getAdminContacts,
  createAdminContact,
  updateAdminContact,
  deleteAdminContact,
  getAdminHelplines,
  createAdminHelpline,
  updateAdminHelpline,
  deleteAdminHelpline,
  getAdminSettings,
  updateAdminSettings
} from '../api';
import CenterMapPicker from '../components/admin/CenterMapPicker';

const AdminPortal = () => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  // Auth States
  const [token, setToken] = useState(() => localStorage.getItem('cou_admin_access_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared Toast & Global Loading
  const [toast, setToast] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ----------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await adminLogin(username, password);
      localStorage.setItem('cou_admin_access_token', res.data.access);
      localStorage.setItem('cou_admin_refresh_token', res.data.refresh);
      setToken(res.data.access);
      showToast('লগইন সফল হয়েছে! স্বাগতম অ্যাডমিন প্যানেলে।');
    } catch (err) {
      setAuthError('ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে। সঠিক তথ্য প্রদান করুন।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cou_admin_access_token');
    localStorage.removeItem('cou_admin_refresh_token');
    setToken(null);
    showToast('লগআউট সফল হয়েছে।', 'info');
  };

  // ----------------------------------------------------------------
  // TAB 1: DASHBOARD STATS
  // ----------------------------------------------------------------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = () => {
    setStatsLoading(true);
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch((err) => {
        if (err.response?.status === 401) handleLogout();
      })
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    if (token && activeTab === 'dashboard') {
      loadStats();
    }
  }, [token, activeTab]);

  // ----------------------------------------------------------------
  // TAB 2: UPLOAD EXEL & BATCH HISTORY
  // ----------------------------------------------------------------
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadBatches = () => {
    getAdminBatches()
      .then((res) => setBatches(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (token && activeTab === 'upload') {
      loadBatches();
    }
  }, [token, activeTab]);

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadExcelTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'seat_plan_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('নমুনা এক্সেল টেমপ্লেট ডাউনলোড হয়েছে।');
    } catch {
      showToast('টেমপ্লেট ডাউনলোড ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleFileUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    const file = fileToUpload;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showToast('শুধুমাত্র .xlsx এক্সেল ফাইল আপলোড করা যাবে।', 'error');
      return;
    }

    setUploading(true);
    setUploadPreview(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadSeatPlan(formData);
      setUploadPreview(res.data);
      showToast('ফাইল সফলভাবে বিশ্লেষিত হয়েছে। প্রিভিউ দেখে নিশ্চিত করুন।');
      loadBatches();
    } catch (err) {
      const errData = err.response?.data;
      if (errData && errData.errors) {
        setUploadPreview(errData);
        showToast('ফাইলে কিছু ত্রুটি পাওয়া গেছে। লাল রঙে চিহ্নিত রো পরীক্ষা করুন।', 'error');
      } else {
        showToast(errData?.error || 'ফাইল আপলোড ব্যর্থ হয়েছে।', 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmBatch = async (batchId) => {
    setGlobalLoading(true);
    try {
      const res = await confirmBatchImport(batchId);
      showToast(`ব্যাচ #${batchId} সফলভাবে ডাটাবেজে ইমপোর্ট ও সক্রিয় করা হয়েছে!`);
      setUploadPreview(null);
      setUploadFile(null);
      loadBatches();
    } catch (err) {
      showToast(err.response?.data?.detail || 'ইমপোর্ট নিশ্চিতকরণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRollback = async (batchId) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ব্যাচ #${batchId} রোলব্যাক (পূর্বাবস্থায় ফেরত) করতে চান?`)) {
      return;
    }
    setGlobalLoading(true);
    try {
      await rollbackBatch(batchId);
      showToast(`ব্যাচ #${batchId} রোলব্যাক সফল হয়েছে। পূর্ববর্তী ব্যাচ সক্রিয় করা হয়েছে।`);
      loadBatches();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.detail || 'রোলব্যাক ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // TAB 3: CENTERS CRUD
  // ----------------------------------------------------------------
  const [centers, setCenters] = useState([]);
  const [centerModalOpen, setCenterModalOpen] = useState(false);
  const [centerForm, setCenterForm] = useState({
    id: null,
    code: '',
    name_bn: '',
    name_en: '',
    address: '',
    latitude: 23.41902,
    longitude: 91.13783,
    gate_info: '',
    instructions_bn: '',
    instructions_en: '',
    photo: null,
  });

  const loadCenters = () => {
    getAdminCenters()
      .then((res) => setCenters(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (token && activeTab === 'centers') {
      loadCenters();
    }
  }, [token, activeTab]);

  const handleSaveCenter = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    const formData = new FormData();
    formData.append('code', centerForm.code);
    formData.append('name_bn', centerForm.name_bn);
    formData.append('name_en', centerForm.name_en);
    formData.append('address', centerForm.address);
    formData.append('latitude', centerForm.latitude);
    formData.append('longitude', centerForm.longitude);
    formData.append('gate_info', centerForm.gate_info || '');
    formData.append('instructions_bn', centerForm.instructions_bn || '');
    formData.append('instructions_en', centerForm.instructions_en || '');
    if (centerForm.photo instanceof File) {
      formData.append('photo', centerForm.photo);
    }

    try {
      if (centerForm.id) {
        await updateAdminCenter(centerForm.id, formData);
        showToast('সেন্টার তথ্য সফলভাবে আপডেট হয়েছে।');
      } else {
        await createAdminCenter(formData);
        showToast('নতুন সেন্টার সফলভাবে তৈরি হয়েছে।');
      }
      setCenterModalOpen(false);
      loadCenters();
    } catch (err) {
      showToast(err.response?.data?.detail || 'সেন্টার সংরক্ষণ ব্যর্থ হয়েছে। সঠিক তথ্য দিন।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteCenter = async (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে '${name}' সেন্টারটি মুছে ফেলতে চান?`)) return;
    setGlobalLoading(true);
    try {
      await deleteAdminCenter(id);
      showToast('সেন্টার সফলভাবে মুছে ফেলা হয়েছে।');
      loadCenters();
    } catch {
      showToast('সেন্টার মোছা ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // TAB 4, 5, 6: NOTICES, STEPS, FAQ CRUD
  // ----------------------------------------------------------------
  const [notices, setNotices] = useState([]);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ id: null, title_bn: '', title_en: '', body_bn: '', body_en: '', is_pinned: false });

  const [steps, setSteps] = useState([]);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [stepForm, setStepForm] = useState({ id: null, order: 1, title_bn: '', title_en: '', description_bn: '', description_en: '', date: '', link: '' });

  const [faqs, setFaqs] = useState([]);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({ id: null, order: 1, question_bn: '', question_en: '', answer_bn: '', answer_en: '' });

  const loadNotices = () => getAdminNotices().then((res) => setNotices(res.data || [])).catch(() => {});
  const loadSteps = () => getAdminSteps().then((res) => setSteps(res.data || [])).catch(() => {});
  const loadFaqs = () => getAdminFAQs().then((res) => setFaqs(res.data || [])).catch(() => {});

  useEffect(() => {
    if (token) {
      if (activeTab === 'notices') loadNotices();
      if (activeTab === 'steps') loadSteps();
      if (activeTab === 'faq') loadFaqs();
    }
  }, [token, activeTab]);

  // Notice save
  const handleSaveNotice = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      if (noticeForm.id) {
        await updateAdminNotice(noticeForm.id, noticeForm);
        showToast('নোটিশ আপডেট হয়েছে।');
      } else {
        await createAdminNotice(noticeForm);
        showToast('নতুন নোটিশ তৈরি হয়েছে।');
      }
      setNoticeModalOpen(false);
      loadNotices();
    } catch {
      showToast('নোটিশ সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Step save
  const handleSaveStep = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      if (stepForm.id) {
        await updateAdminStep(stepForm.id, stepForm);
        showToast('ধাপ আপডেট হয়েছে।');
      } else {
        await createAdminStep(stepForm);
        showToast('নতুন ধাপ যুক্ত হয়েছে।');
      }
      setStepModalOpen(false);
      loadSteps();
    } catch {
      showToast('ধাপ সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // FAQ save
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      if (faqForm.id) {
        await updateAdminFAQ(faqForm.id, faqForm);
        showToast('FAQ আপডেট হয়েছে।');
      } else {
        await createAdminFAQ(faqForm);
        showToast('নতুন FAQ যুক্ত হয়েছে।');
      }
      setFaqModalOpen(false);
      loadFaqs();
    } catch {
      showToast('FAQ সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // TAB 7: SETTINGS
  // ----------------------------------------------------------------
  const [settingsData, setSettingsData] = useState({
    require_verification: false,
    verification_field_label_en: '',
    verification_field_label_bn: '',
    helpdesk_phone: '',
    helpdesk_email: '',
    rate_limit_per_minute: 20,
  });

  const loadSettings = () => {
    getAdminSettings()
      .then((res) => setSettingsData(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    if (token && activeTab === 'settings') {
      loadSettings();
    }
  }, [token, activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      const res = await updateAdminSettings(settingsData);
      setSettingsData(res.data);
      showToast('সেটিংস সফলভাবে সংরক্ষিত ও কার্যকর হয়েছে!');
    } catch {
      showToast('সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const [helpSubTab, setHelpSubTab] = useState('helplines');
  const [helplines, setHelplines] = useState([]);
  const [helplineModalOpen, setHelplineModalOpen] = useState(false);
  const [helplineForm, setHelplineForm] = useState({
    id: null,
    label_bn: '',
    label_en: '',
    phone: '',
    is_primary: false,
    order: 0,
  });

  const loadHelplines = () => {
    getAdminHelplines()
      .then((res) => setHelplines(res.data || []))
      .catch(() => {});
  };

  const handleEditHelpline = (item = null) => {
    if (item) {
      setHelplineForm({
        id: item.id,
        label_bn: item.label_bn || '',
        label_en: item.label_en || '',
        phone: item.phone || '',
        is_primary: !!item.is_primary,
        order: item.order || 0,
      });
    } else {
      setHelplineForm({
        id: null,
        label_bn: '',
        label_en: '',
        phone: '',
        is_primary: false,
        order: 0,
      });
    }
    setHelplineModalOpen(true);
  };

  const handleSaveHelpline = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      if (helplineForm.id) {
        await updateAdminHelpline(helplineForm.id, helplineForm);
        showToast('হেল্পলাইন নম্বর সফলভাবে আপডেট করা হয়েছে।');
      } else {
        await createAdminHelpline(helplineForm);
        showToast('নতুন হেল্পলাইন নম্বর যুক্ত করা হয়েছে।');
      }
      setHelplineModalOpen(false);
      loadHelplines();
    } catch {
      showToast('হেল্পলাইন সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteHelpline = async (id) => {
    if (!window.confirm('আপনি কি এই হেল্পলাইন নম্বরটি মুছে ফেলতে চান?')) return;
    setGlobalLoading(true);
    try {
      await deleteAdminHelpline(id);
      showToast('হেল্পলাইন মুছে ফেলা হয়েছে।');
      loadHelplines();
    } catch {
      showToast('হেল্পলাইন মুছে ফেলা যায়নি।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleToggleHelplinePrimary = async (item) => {
    setGlobalLoading(true);
    try {
      await updateAdminHelpline(item.id, { is_primary: !item.is_primary });
      showToast(`হেল্পলাইন #${item.id} প্রাইমারি স্ট্যাটাস পরিবর্তিত হয়েছে।`);
      loadHelplines();
    } catch {
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // 2. Associations State
  const [associations, setAssociations] = useState([]);
  const [assocModalOpen, setAssocModalOpen] = useState(false);
  const [assocForm, setAssocForm] = useState({
    id: null,
    name_bn: '',
    name_en: '',
    type: 'division',
    order: 0,
    is_active: true,
  });

  const loadAssociations = () => {
    getAdminAssociations()
      .then((res) => setAssociations(res.data || []))
      .catch(() => {});
  };

  const handleEditAssoc = (item = null) => {
    if (item) {
      setAssocForm({
        id: item.id,
        name_bn: item.name_bn || '',
        name_en: item.name_en || '',
        type: item.type || 'division',
        order: item.order || 0,
        is_active: !!item.is_active,
      });
    } else {
      setAssocForm({
        id: null,
        name_bn: '',
        name_en: '',
        type: 'division',
        order: 0,
        is_active: true,
      });
    }
    setAssocModalOpen(true);
  };

  const handleSaveAssoc = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      if (assocForm.id) {
        await updateAdminAssociation(assocForm.id, assocForm);
        showToast('সংগঠনের তথ্য সফলভাবে আপডেট হয়েছে।');
      } else {
        await createAdminAssociation(assocForm);
        showToast('নতুন সংগঠন সফলভাবে যুক্ত হয়েছে।');
      }
      setAssocModalOpen(false);
      loadAssociations();
    } catch {
      showToast('সংগঠন সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteAssoc = async (id) => {
    if (!window.confirm('আপনি কি এই সংগঠনটি মুছে ফেলতে চান? এর সাথে যুক্ত সকল প্রতিনিধির তথ্যও মুছে যাবে।')) return;
    setGlobalLoading(true);
    try {
      await deleteAdminAssociation(id);
      showToast('সংগঠন মুছে ফেলা হয়েছে।');
      loadAssociations();
      loadContacts();
    } catch {
      showToast('সংগঠন মুছে ফেলা যায়নি।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleToggleAssocActive = async (item) => {
    setGlobalLoading(true);
    try {
      await updateAdminAssociation(item.id, { is_active: !item.is_active });
      showToast(`সংগঠন ${item.name_bn} স্ট্যাটাস পরিবর্তিত হয়েছে।`);
      loadAssociations();
    } catch {
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // 3. Contacts State
  const [contacts, setContacts] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactFilterAssoc, setContactFilterAssoc] = useState('');
  const [contactForm, setContactForm] = useState({
    id: null,
    association: '',
    role: 'secretary',
    name: '',
    phone: '',
    whatsapp: '',
    available_time: '',
    is_visible: true,
  });

  const loadContacts = () => {
    getAdminContacts()
      .then((res) => setContacts(res.data || []))
      .catch(() => {});
  };

  const handleEditContact = (item = null) => {
    if (item) {
      setContactForm({
        id: item.id,
        association: item.association || '',
        role: item.role || 'secretary',
        name: item.name || '',
        phone: item.phone || '',
        whatsapp: item.whatsapp || '',
        available_time: item.available_time || '',
        is_visible: item.is_visible !== false,
      });
    } else {
      setContactForm({
        id: null,
        association: associations[0]?.id || '',
        role: 'secretary',
        name: '',
        phone: '',
        whatsapp: '',
        available_time: 'সকাল ৯টা - রাত ৮টা',
        is_visible: true,
      });
    }
    setContactModalOpen(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactForm.association) {
      showToast('দয়া করে একটি সংগঠন নির্বাচন করুন।', 'error');
      return;
    }
    setGlobalLoading(true);
    try {
      if (contactForm.id) {
        await updateAdminContact(contactForm.id, contactForm);
        showToast('প্রতিনিধির তথ্য সফলভাবে আপডেট হয়েছে।');
      } else {
        await createAdminContact(contactForm);
        showToast('নতুন প্রতিনিধি সফলভাবে যুক্ত হয়েছে।');
      }
      setContactModalOpen(false);
      loadContacts();
    } catch {
      showToast('প্রতিনিধি সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('আপনি কি এই প্রতিনিধির তথ্য মুছে ফেলতে চান?')) return;
    setGlobalLoading(true);
    try {
      await deleteAdminContact(id);
      showToast('প্রতিনিধি মুছে ফেলা হয়েছে।');
      loadContacts();
    } catch {
      showToast('প্রতিনিধি মুছে ফেলা যায়নি।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleToggleContactVisibility = async (item) => {
    setGlobalLoading(true);
    try {
      await updateAdminContact(item.id, { is_visible: !item.is_visible });
      showToast(`প্রতিনিধি ${item.name}-এর দৃশ্যমানতা পরিবর্তিত হয়েছে (${!item.is_visible ? 'সক্রিয়/দৃশ্যমান' : 'লুকানো'})`);
      loadContacts();
    } catch {
      showToast('দৃশ্যমানতা পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'help') {
      loadHelplines();
      loadAssociations();
      loadContacts();
    }
  }, [token, activeTab]);

  // ----------------------------------------------------------------
  // RENDER: LOGIN FORM IF NOT AUTHENTICATED
  // ----------------------------------------------------------------
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-7 md:p-8 border border-slate-200 shadow-xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-sky-tint text-primary flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {t('admin.login_title')}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              কুমিল্লা বিশ্ববিদ্যালয় ভর্তি পরীক্ষা নিয়ন্ত্রণ কক্ষ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('admin.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('admin.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              {authLoading ? 'যাচাই করা হচ্ছে...' : t('admin.login_btn')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // RENDER: PROTECTED ADMIN DASHBOARD
  // ----------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-4 py-6 md:py-8 space-y-6 pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border pointer-events-none ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Top Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
              অ্যাডমিন পোর্টাল (CoU Admin)
            </h2>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              সিস্টেম সক্রিয় • JWT অথেন্টিকেটেড
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar border border-slate-200 shadow-inner">
        {[
          { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'upload', label: 'এক্সেল আপলোড', icon: UploadCloud },
          { id: 'centers', label: 'পরীক্ষাকেন্দ্র', icon: MapPin },
          { id: 'notices', label: 'নোটিশ', icon: Bell },
          { id: 'steps', label: 'ভর্তি ধাপ', icon: ListOrdered },
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
          { id: 'help', label: 'হেল্প ও সংগঠন', icon: LifeBuoy },
          { id: 'settings', label: 'সেটিংস', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ */}
      {/* TAB 1: DASHBOARD OVERVIEW & HOURLY CHART */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 mt-2 font-medium">পরিসংখ্যান লোড হচ্ছে...</p>
            </div>
          ) : stats ? (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wide">মোট পরীক্ষার্থী</span>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {stats.total_candidates}
                  </p>
                  <p className="text-[11px] text-slate-500">সিট বরাদ্দ: {stats.total_seats}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wide">মোট অনুসন্ধান</span>
                    <Search className="w-4 h-4 text-bright-blue" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-bright-blue font-mono">
                    {stats.total_searches}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    সফল: {stats.found_searches} • নট-ফাউন্ড: {stats.not_found_searches}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wide">গত ১ ঘণ্টার সার্চ</span>
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                    {stats.searches_last_hour}
                  </p>
                  <p className="text-[11px] text-slate-500">প্রতি মিনিটে ট্রাফিক সক্রিয়</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wide">নিবন্ধিত কেন্দ্র</span>
                    <Building className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    {stats.total_centers}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    সক্রিয় ব্যাচ: {stats.active_batch_id ? `#${stats.active_batch_id}` : 'নেই'}
                  </p>
                </div>
              </div>

              {/* Small Chart: Searches Per Hour */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      অনুসন্ধান ট্রাফিক চার্ট (Searches Per Hour)
                    </h3>
                    <p className="text-xs text-slate-500">গত ১২ ঘণ্টার প্রতি ঘণ্টার রিয়েল-টাইম সার্চ পরিসংখ্যান</p>
                  </div>
                  <button
                    onClick={loadStats}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                    title="রিলোড চার্ট"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Bar Chart Container */}
                <div className="pt-4">
                  {stats.hourly_searches && stats.hourly_searches.length > 0 ? (
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 sm:h-52 px-2 border-b border-slate-200 pb-2">
                      {stats.hourly_searches.map((item, idx) => {
                        const maxVal = Math.max(...stats.hourly_searches.map((s) => s.searches), 1);
                        const heightPercent = Math.max(Math.round((item.searches / maxVal) * 100), 6);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                              {item.searches} searches ({item.hour})
                            </div>

                            {/* Bar Column */}
                            <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercent}%` }}
                                transition={{ duration: 0.5, delay: idx * 0.03 }}
                                className="w-full bg-gradient-to-t from-primary to-bright-blue group-hover:from-blue-600 group-hover:to-cyan-400 transition-colors rounded-t-md"
                              />
                            </div>

                            {/* X-axis Label */}
                            <span className="text-[10px] text-slate-400 font-mono rotate-45 sm:rotate-0 mt-1">
                              {item.hour}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">কোনো চার্ট ডেটা নেই</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 2: UPLOAD EXCEL & VALIDATION PREVIEW */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload & Template Actions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  এক্সেল সিট প্ল্যান আপলোড ও ভ্যালিডেশন
                </h3>
                <p className="text-xs text-slate-500">
                  নির্ধারিত ফরম্যাটের .xlsx ফাইল ড্র্যাগ করে ছাড়ুন অথবা ফাইল সিলেক্ট করুন
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-tint text-primary hover:bg-blue-100 font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>টেমপ্লেট ডাউনলোড (.xlsx)</span>
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setUploadFile(e.dataTransfer.files[0]);
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-bright-blue bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-primary/60 bg-slate-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-full bg-blue-100/70 text-primary flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-800">
                {uploadFile ? uploadFile.name : 'এক্সেল ফাইলটি এখানে টেনে এনে রাখুন'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                অথবা আপনার কম্পিউটার থেকে ব্রাউজ করতে এখানে ক্লিক করুন (সর্বোচ্চ ১০ এমবি)
              </p>

              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>ফাইল যাচাই ও প্রসেসিং হচ্ছে...</span>
                </div>
              )}
            </div>

            {/* Preview Table & Confirm / Cancel Actions */}
            {uploadPreview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-4 border-t border-slate-100"
              >
                {/* Stats Summary Chips */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                      মোট রো: {uploadPreview.total_rows}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                      সঠিক: {uploadPreview.valid_rows_count}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                        uploadPreview.failed_rows_count > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      ত্রুটি: {uploadPreview.failed_rows_count}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setUploadPreview(null);
                        setUploadFile(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      বাতিল (Cancel)
                    </button>

                    <button
                      onClick={() => handleConfirmBatch(uploadPreview.batch_id)}
                      disabled={uploadPreview.valid_rows_count === 0}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-900 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>ইমপোর্ট নিশ্চিত করুন ({uploadPreview.valid_rows_count} রো)</span>
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-inner max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">রো #</th>
                        <th className="p-3">রোল</th>
                        <th className="p-3">নাম</th>
                        <th className="p-3">ইউনিট</th>
                        <th className="p-3">সেন্টার</th>
                        <th className="p-3">ভবন ও রুম</th>
                        <th className="p-3">আসন</th>
                        <th className="p-3">তারিখ ও সময়</th>
                        <th className="p-3">স্ট্যাটাস / ত্রুটি</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uploadPreview.preview_rows &&
                        uploadPreview.preview_rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={row.has_error ? 'bg-rose-50/80 text-rose-900 font-medium' : 'hover:bg-slate-50/80'}
                          >
                            <td className="p-3 font-mono font-bold">{row.row_number}</td>
                            <td className="p-3 font-mono">{row.roll}</td>
                            <td className="p-3">{row.name}</td>
                            <td className="p-3 font-bold">{row.unit}</td>
                            <td className="p-3 font-mono">{row.center_code}</td>
                            <td className="p-3">{row.building} • R:{row.room}</td>
                            <td className="p-3 font-mono font-bold">{row.seat_no}</td>
                            <td className="p-3 font-mono text-[11px]">{row.exam_date} {row.exam_time}</td>
                            <td className="p-3">
                              {row.has_error ? (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{row.error_message}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>সঠিক</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>

          {/* Upload History Table & Rollback */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              আপলোড ব্যাচ হিস্ট্রি ও রোলব্যাক (Upload Batches)
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">ব্যাচ আইডি</th>
                    <th className="p-3">আপলোডের সময়</th>
                    <th className="p-3">মোট রো</th>
                    <th className="p-3">ত্রুটি</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3">সক্রিয়?</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold">#{b.id}</td>
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(b.uploaded_at).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono font-semibold">{b.rows_total}</td>
                      <td className="p-3 font-mono text-rose-600">{b.rows_failed}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {b.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                            সক্রিয় ব্যাচ (ACTIVE)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">নিষ্ক্রিয়</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleRollback(b.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>রোলব্যাক</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 3: CENTERS CRUD WITH MAP PICKER */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'centers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                পরীক্ষাকেন্দ্র তালিকা ও ব্যবস্থাপনা ({centers.length})
              </h3>
              <p className="text-xs text-slate-500">ম্যাপ পিকার দিয়ে যেকোনো নতুন ভেন্যু যুক্ত করুন</p>
            </div>

            <button
              onClick={() => {
                setCenterForm({
                  id: null,
                  code: '',
                  name_bn: '',
                  name_en: '',
                  address: '',
                  latitude: 23.41902,
                  longitude: 91.13783,
                  gate_info: '',
                  instructions_bn: '',
                  instructions_en: '',
                  photo: null,
                });
                setCenterModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-blue-900 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কেন্দ্র যোগ করুন</span>
            </button>
          </div>

          {/* Centers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-tint text-primary">
                      {c.code}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                      {c.name_bn}
                    </h4>
                    <p className="text-xs text-slate-500">{c.name_en}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setCenterForm({
                          id: c.id,
                          code: c.code,
                          name_bn: c.name_bn,
                          name_en: c.name_en,
                          address: c.address,
                          latitude: parseFloat(c.latitude),
                          longitude: parseFloat(c.longitude),
                          gate_info: c.gate_info || '',
                          instructions_bn: c.instructions_bn || '',
                          instructions_en: c.instructions_en || '',
                          photo: null,
                        });
                        setCenterModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors"
                      title="এডিট"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCenter(c.id, c.name_en)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600">{c.address}</p>

                <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                  <span>📍 {c.latitude}, {c.longitude}</span>
                  {c.gate_info && <span>🚪 {c.gate_info}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Center Form Modal */}
          {centerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">
                    {centerForm.id ? 'সেন্টার এডিট করুন' : 'নতুন পরীক্ষাকেন্দ্র যোগ করুন'}
                  </h3>
                  <button onClick={() => setCenterModalOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSaveCenter} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">সেন্টার কোড</label>
                      <input
                        type="text"
                        value={centerForm.code}
                        onChange={(e) => setCenterForm({ ...centerForm, code: e.target.value })}
                        placeholder="e.g. CUC-01"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">গেট ইনফো</label>
                      <input
                        type="text"
                        value={centerForm.gate_info}
                        onChange={(e) => setCenterForm({ ...centerForm, gate_info: e.target.value })}
                        placeholder="e.g. Main Gate (Gate 1)"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">কেন্দ্রের নাম (বাংলা)</label>
                    <input
                      type="text"
                      value={centerForm.name_bn}
                      onChange={(e) => setCenterForm({ ...centerForm, name_bn: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">কেন্দ্রের নাম (English)</label>
                    <input
                      type="text"
                      value={centerForm.name_en}
                      onChange={(e) => setCenterForm({ ...centerForm, name_en: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ঠিকানা</label>
                    <textarea
                      value={centerForm.address}
                      onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                      required
                    />
                  </div>

                  {/* Leaflet Map Picker */}
                  <CenterMapPicker
                    latitude={centerForm.latitude}
                    longitude={centerForm.longitude}
                    suggestedQuery={centerForm.name_en || centerForm.name_bn || centerForm.address}
                    onLocationSelect={(lat, lng) => {
                      setCenterForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                    }}
                  />

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">কেন্দ্রের ছবি (ঐচ্ছিক)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCenterForm({ ...centerForm, photo: e.target.files[0] });
                        }
                      }}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">দিকনির্দেশনা (বাংলা)</label>
                      <textarea
                        value={centerForm.instructions_bn}
                        onChange={(e) => setCenterForm({ ...centerForm, instructions_bn: e.target.value })}
                        rows={2}
                        placeholder="গেটের পর কীভাবে যাবে..."
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Instructions (EN)</label>
                      <textarea
                        value={centerForm.instructions_en}
                        onChange={(e) => setCenterForm({ ...centerForm, instructions_en: e.target.value })}
                        rows={2}
                        placeholder="Gate -> Building -> Room..."
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCenterModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-900 text-white font-bold"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 4: NOTICES CRUD */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              নোটিশ ব্যবস্থাপনা ({notices.length})
            </h3>
            <button
              onClick={() => {
                setNoticeForm({ id: null, title_bn: '', title_en: '', body_bn: '', body_en: '', is_pinned: false });
                setNoticeModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন নোটিশ লিখুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {n.is_pinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        পিন্ড নোটিশ
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(n.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">{n.title_bn}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body_bn}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setNoticeForm(n);
                      setNoticeModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('নোটিশটি মুছে ফেলতে চান?')) {
                        await deleteAdminNotice(n.id);
                        showToast('নোটিশ মোছা হয়েছে।');
                        loadNotices();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {noticeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <h4 className="font-bold text-base text-slate-900">
                  {noticeForm.id ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি'}
                </h4>
                <form onSubmit={handleSaveNotice} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">শিরোনাম (বাংলা)</label>
                    <input
                      type="text"
                      value={noticeForm.title_bn}
                      onChange={(e) => setNoticeForm({ ...noticeForm, title_bn: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">শিরোনাম (English)</label>
                    <input
                      type="text"
                      value={noticeForm.title_en}
                      onChange={(e) => setNoticeForm({ ...noticeForm, title_en: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">বিবরণ (বাংলা)</label>
                    <textarea
                      value={noticeForm.body_bn}
                      onChange={(e) => setNoticeForm({ ...noticeForm, body_bn: e.target.value })}
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">বিবরণ (English)</label>
                    <textarea
                      value={noticeForm.body_en}
                      onChange={(e) => setNoticeForm({ ...noticeForm, body_en: e.target.value })}
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pinnedCheck"
                      checked={noticeForm.is_pinned}
                      onChange={(e) => setNoticeForm({ ...noticeForm, is_pinned: e.target.checked })}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <label htmlFor="pinnedCheck" className="font-semibold text-slate-700">হোম পেজে পিন করে রাখুন (Pinned Notice)</label>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setNoticeModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">বাতিল</button>
                    <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold">সংরক্ষণ</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 5: ADMISSION STEPS CRUD */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'steps' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              ভর্তি প্রক্রিয়ার ধাপসমূহ ({steps.length})
            </h3>
            <button
              onClick={() => {
                setStepForm({ id: null, order: steps.length + 1, title_bn: '', title_en: '', description_bn: '', description_en: '', date: '', link: '' });
                setStepModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ধাপ যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center font-mono">
                    {s.order}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{s.title_bn}</h4>
                    <p className="text-xs text-slate-500">{s.date || 'কোনো তারিখ নেই'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => { setStepForm(s); setStepModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('ধাপটি মুছতে চান?')) {
                        await deleteAdminStep(s.id);
                        showToast('ধাপ মোছা হয়েছে।');
                        loadSteps();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {stepModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <h4 className="font-bold text-base text-slate-900">{stepForm.id ? 'ধাপ সম্পাদনা' : 'নতুন ধাপ'}</h4>
                <form onSubmit={handleSaveStep} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ক্রম নম্বর (Order)</label>
                      <input type="number" value={stepForm.order} onChange={(e) => setStepForm({ ...stepForm, order: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">তারিখ লেবেল</label>
                      <input type="text" value={stepForm.date} onChange={(e) => setStepForm({ ...stepForm, date: e.target.value })} placeholder="e.g. 15-30 Nov 2026" className="w-full p-2.5 rounded-xl border border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">শিরোনাম (বাংলা)</label>
                    <input type="text" value={stepForm.title_bn} onChange={(e) => setStepForm({ ...stepForm, title_bn: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">শিরোনাম (English)</label>
                    <input type="text" value={stepForm.title_en} onChange={(e) => setStepForm({ ...stepForm, title_en: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">বিবরণ</label>
                    <textarea value={stepForm.description_bn} onChange={(e) => setStepForm({ ...stepForm, description_bn: e.target.value })} rows={2} className="w-full p-2.5 rounded-xl border border-slate-200" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">অফিসিয়াল ওয়েব লিংক</label>
                    <input type="url" value={stepForm.link} onChange={(e) => setStepForm({ ...stepForm, link: e.target.value })} placeholder="https://admission.cou.ac.bd" className="w-full p-2.5 rounded-xl border border-slate-200" />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setStepModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">বাতিল</button>
                    <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold">সংরক্ষণ</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 6: FAQ CRUD */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              প্রশ্নোত্তর (FAQ) ব্যবস্থাপনা ({faqs.length})
            </h3>
            <button
              onClick={() => {
                setFaqForm({ id: null, order: faqs.length + 1, question_bn: '', question_en: '', answer_bn: '', answer_en: '' });
                setFaqModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রশ্ন যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono text-slate-400">Order #{f.order}</span>
                  <h4 className="font-bold text-sm text-slate-900">{f.question_bn}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{f.answer_bn}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setFaqForm(f); setFaqModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('FAQ মুছে ফেলতে চান?')) {
                        await deleteAdminFAQ(f.id);
                        showToast('FAQ মোছা হয়েছে।');
                        loadFaqs();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {faqModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <h4 className="font-bold text-base text-slate-900">{faqForm.id ? 'FAQ সম্পাদনা' : 'নতুন FAQ'}</h4>
                <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ক্রম নম্বর (Order)</label>
                    <input type="number" value={faqForm.order} onChange={(e) => setFaqForm({ ...faqForm, order: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">প্রশ্ন (বাংলা)</label>
                    <input type="text" value={faqForm.question_bn} onChange={(e) => setFaqForm({ ...faqForm, question_bn: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">প্রশ্ন (English)</label>
                    <input type="text" value={faqForm.question_en} onChange={(e) => setFaqForm({ ...faqForm, question_en: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">উত্তর (বাংলা)</label>
                    <textarea value={faqForm.answer_bn} onChange={(e) => setFaqForm({ ...faqForm, answer_bn: e.target.value })} rows={3} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">উত্তর (English)</label>
                    <textarea value={faqForm.answer_en} onChange={(e) => setFaqForm({ ...faqForm, answer_en: e.target.value })} rows={3} className="w-full p-2.5 rounded-xl border border-slate-200" required />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setFaqModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">বাতিল</button>
                    <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold">সংরক্ষণ</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Help & Associations */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'help' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-primary" />
                সহায়তা ও শিক্ষার্থী সংগঠন ব্যবস্থাপনা (Help & Associations)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                মূল হেল্পলাইন, জেলা/বিভাগীয় সংগঠন ও স্বেচ্ছাসেবক প্রতিনিধিদের তথ্য ও দৃশ্যমানতা নিয়ন্ত্রণ করুন
              </p>
            </div>

            {/* Sub-nav Pill Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setHelpSubTab('helplines')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  helpSubTab === 'helplines' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                হেল্পলাইন নম্বর ({helplines.length})
              </button>
              <button
                type="button"
                onClick={() => setHelpSubTab('associations')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  helpSubTab === 'associations' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সংগঠনসমূহ ({associations.length})
              </button>
              <button
                type="button"
                onClick={() => setHelpSubTab('contacts')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  helpSubTab === 'contacts' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                প্রতিনিধি ও দৃশ্যমানতা ({contacts.length})
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: HELPLINES */}
          {helpSubTab === 'helplines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  পরীক্ষার্থীদের জন্য মূল ও জরুরি হেল্পলাইন নম্বরসমূহ
                </p>
                <button
                  type="button"
                  onClick={() => handleEditHelpline(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-900 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  নতুন হেল্পলাইন
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">লেবেল (বাংলা ও ইংরেজি)</th>
                      <th className="p-3">ফোন নম্বর</th>
                      <th className="p-3">টাইপ / স্ট্যাটাস</th>
                      <th className="p-3">ক্রম</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {helplines.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-400">
                          কোনো হেল্পলাইন নম্বর পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      helplines.map((hl) => (
                        <tr key={hl.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{hl.label_bn}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{hl.label_en}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-primary">
                            <a href={`tel:${hl.phone}`} className="hover:underline">
                              {hl.phone}
                            </a>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleHelplinePrimary(hl)}
                              title="ক্লিক করে প্রাইমারি পরিবর্তন করুন"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                hl.is_primary
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {hl.is_primary ? '★ মূল হেল্পলাইন' : 'জরুরি / অন্যান্য'}
                            </button>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{hl.order}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleEditHelpline(hl)}
                              className="p-1.5 text-slate-600 hover:text-primary rounded-lg hover:bg-slate-100"
                              title="সম্পাদনা"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHelpline(hl.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: ASSOCIATIONS */}
          {helpSubTab === 'associations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  বিশ্ববিদ্যালয়ের জেলা ও বিভাগভিত্তিক শিক্ষার্থী কল্যাণ পরিষদ
                </p>
                <button
                  type="button"
                  onClick={() => handleEditAssoc(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-900 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  নতুন সংগঠন
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">সংগঠনের নাম (বাংলা / ইংরেজি)</th>
                      <th className="p-3">ধরণ</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3">ক্রম</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-400">
                          কোনো সংগঠন পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      associations.map((asc) => (
                        <tr key={asc.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{asc.name_bn}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{asc.name_en}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                              {asc.type === 'division' ? 'বিভাগীয়' : asc.type === 'district' ? 'জেলা' : 'অন্যান্য'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleAssocActive(asc)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                                asc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {asc.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </button>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{asc.order}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleEditAssoc(asc)}
                              className="p-1.5 text-slate-600 hover:text-primary rounded-lg hover:bg-slate-100"
                              title="সম্পাদনা"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssoc(asc.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: CONTACTS & ONE-CLICK VISIBILITY TOGGLE */}
          {helpSubTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={contactFilterAssoc}
                    onChange={(e) => setContactFilterAssoc(e.target.value)}
                    className="p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
                  >
                    <option value="">সকল সংগঠন ({contacts.length})</option>
                    {associations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name_bn}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    * দৃশ্যমানতা টগল করে তাৎক্ষণিক পাবলিক পেজ থেকে গোপন বা প্রকাশ করুন
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleEditContact(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-900 shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  নতুন প্রতিনিধি
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">প্রতিনিধি ও সংগঠন</th>
                      <th className="p-3">পদবী (Role)</th>
                      <th className="p-3">যোগাযোগের নম্বর</th>
                      <th className="p-3">পাওয়ার সময়</th>
                      <th className="p-3">দৃশ্যমানতা (Visibility)</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts
                      .filter((c) => !contactFilterAssoc || String(c.association) === String(contactFilterAssoc))
                      .map((c) => {
                        const assoc = associations.find((a) => a.id === c.association);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {assoc ? assoc.name_bn : `সংগঠন #${c.association}`}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-sky-tint text-primary text-[11px] font-bold">
                                {c.role === 'secretary'
                                  ? 'সভাপতি'
                                  : c.role === 'general_secretary'
                                  ? 'সাধারণ সম্পাদক'
                                  : c.role}
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              <div className="text-primary font-bold">{c.phone}</div>
                              {c.whatsapp && (
                                <div className="text-emerald-600 text-[11px]">WA: {c.whatsapp}</div>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">{c.available_time || '২৪ ঘণ্টা'}</td>
                            <td className="p-3">
                              {/* Toggle visibility */}
                              <button
                                type="button"
                                onClick={() => handleToggleContactVisibility(c)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                                  c.is_visible
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                                title="ক্লিক করে দৃশ্যমানতা পরিবর্তন করুন"
                              >
                                {c.is_visible ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>দৃশ্যমান (পাবলিক)</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                                    <span>লুকানো (গোপন)</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleEditContact(c)}
                                className="p-1.5 text-slate-600 hover:text-primary rounded-lg hover:bg-slate-100"
                                title="সম্পাদনা"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(c.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODAL 1: HELPLINE */}
          {helplineModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {helplineForm.id ? 'হেল্পলাইন সম্পাদনা' : 'নতুন হেল্পলাইন যুক্তকরণ'}
                  </h4>
                  <button onClick={() => setHelplineModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveHelpline} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">লেবেল (বাংলা)</label>
                    <input
                      type="text"
                      required
                      value={helplineForm.label_bn}
                      onChange={(e) => setHelplineForm({ ...helplineForm, label_bn: e.target.value })}
                      placeholder="যেমন: ভর্তি হেল্পডেস্ক কন্ট্রোলরুম"
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">লেবেল (ইংরেজি)</label>
                    <input
                      type="text"
                      required
                      value={helplineForm.label_en}
                      onChange={(e) => setHelplineForm({ ...helplineForm, label_en: e.target.value })}
                      placeholder="e.g. Admission Helpdesk Control Room"
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                    <input
                      type="text"
                      required
                      value={helplineForm.phone}
                      onChange={(e) => setHelplineForm({ ...helplineForm, phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="w-full p-2.5 border rounded-xl font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">সিরিয়াল / ক্রম</label>
                      <input
                        type="number"
                        value={helplineForm.order}
                        onChange={(e) => setHelplineForm({ ...helplineForm, order: Number(e.target.value) })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>
                    <div className="pt-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_primary_check"
                        checked={helplineForm.is_primary}
                        onChange={(e) => setHelplineForm({ ...helplineForm, is_primary: e.target.checked })}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="is_primary_check" className="font-bold text-slate-700 cursor-pointer">
                        মূল হেল্পলাইন?
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setHelplineModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-blue-900"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: ASSOCIATION */}
          {assocModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {assocForm.id ? 'সংগঠন সম্পাদনা' : 'নতুন সংগঠন যুক্তকরণ'}
                  </h4>
                  <button onClick={() => setAssocModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveAssoc} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সংগঠনের নাম (বাংলা)</label>
                    <input
                      type="text"
                      required
                      value={assocForm.name_bn}
                      onChange={(e) => setAssocForm({ ...assocForm, name_bn: e.target.value })}
                      placeholder="যেমন: চট্টগ্রাম বিভাগীয় ছাত্রকল্যাণ পরিষদ"
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সংগঠনের নাম (ইংরেজি)</label>
                    <input
                      type="text"
                      required
                      value={assocForm.name_en}
                      onChange={(e) => setAssocForm({ ...assocForm, name_en: e.target.value })}
                      placeholder="e.g. Chittagong Division Student Association"
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ধরণ</label>
                      <select
                        value={assocForm.type}
                        onChange={(e) => setAssocForm({ ...assocForm, type: e.target.value })}
                        className="w-full p-2.5 border rounded-xl bg-white"
                      >
                        <option value="division">বিভাগীয় (Division)</option>
                        <option value="district">জেলা (District)</option>
                        <option value="other">অন্যান্য (Other)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">সিরিয়াল / ক্রম</label>
                      <input
                        type="number"
                        value={assocForm.order}
                        onChange={(e) => setAssocForm({ ...assocForm, order: Number(e.target.value) })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_active_assoc"
                      checked={assocForm.is_active}
                      onChange={(e) => setAssocForm({ ...assocForm, is_active: e.target.checked })}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="is_active_assoc" className="font-bold text-slate-700 cursor-pointer">
                      সক্রিয় অবস্থা (পাবলিক সাইটে প্রদর্শিত হবে)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setAssocModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-blue-900"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 3: CONTACT */}
          {contactModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {contactForm.id ? 'প্রতিনিধি সম্পাদনা' : 'নতুন প্রতিনিধি যুক্তকরণ'}
                  </h4>
                  <button onClick={() => setContactModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সংগঠন নির্বাচন</label>
                    <select
                      required
                      value={contactForm.association}
                      onChange={(e) => setContactForm({ ...contactForm, association: e.target.value })}
                      className="w-full p-2.5 border rounded-xl bg-white"
                    >
                      <option value="">সংগঠন বেছে নিন...</option>
                      {associations.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name_bn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পদবী / দায়িত্ব</label>
                      <select
                        value={contactForm.role}
                        onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        className="w-full p-2.5 border rounded-xl bg-white"
                      >
                        <option value="secretary">সভাপতি (President/Secretary)</option>
                        <option value="general_secretary">সাধারণ সম্পাদক (General Secretary)</option>
                        <option value="other">অন্যান্য (Other)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">প্রতিনিধির নাম</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="নাম লিখুন"
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                      <input
                        type="text"
                        required
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">হোয়াটসঅ্যাপ (ঐচ্ছিক)</label>
                      <input
                        type="text"
                        value={contactForm.whatsapp}
                        onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">পাওয়ার সময় (Available Time)</label>
                    <input
                      type="text"
                      value={contactForm.available_time}
                      onChange={(e) => setContactForm({ ...contactForm, available_time: e.target.value })}
                      placeholder="যেমন: সকাল ৯টা - রাত ৯টা"
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_visible_contact"
                      checked={contactForm.is_visible}
                      onChange={(e) => setContactForm({ ...contactForm, is_visible: e.target.checked })}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="is_visible_contact" className="font-bold text-slate-700 cursor-pointer">
                      পাবলিক সাইটে দৃশ্যমান রাখুন (is_visible)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setContactModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-blue-900"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* TAB 7: SETTINGS & VERIFICATION TOGGLE */}
      {/* ------------------------------------------------------------ */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              সিস্টেম কনফিগারেশন ও ভেরিফিকেশন সেটিংস
            </h3>
            <p className="text-xs text-slate-500">
              অনুসন্ধান সুরক্ষা এবং হেল্পডেস্ক তথ্য নিয়ন্ত্রণ করুন
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs sm:text-sm">
            {/* Toggle Require Verification Field */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block text-sm">
                  দ্বিতীয় যাচাইকরণ ফিল্ড সক্রিয় করুন (Require 2nd Verification Field)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  সক্রিয় থাকলে পরীক্ষার্থীকে রোলের পাশাপাশি মোবাইল শেষ ৪ ডিজিট বা সিরিয়াল দিতে হবে
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settingsData.require_verification}
                  onChange={(e) => setSettingsData({ ...settingsData, require_verification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {settingsData.require_verification && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 p-4 rounded-2xl bg-sky-tint/50 border border-blue-100"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    যাচাইকরণ ফিল্ডের লেবেল (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={settingsData.verification_field_label_bn}
                    onChange={(e) => setSettingsData({ ...settingsData, verification_field_label_bn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verification Field Label (English)
                  </label>
                  <input
                    type="text"
                    value={settingsData.verification_field_label_en}
                    onChange={(e) => setSettingsData({ ...settingsData, verification_field_label_en: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  হেল্পডেস্ক ফোন নম্বর
                </label>
                <input
                  type="text"
                  value={settingsData.helpdesk_phone}
                  onChange={(e) => setSettingsData({ ...settingsData, helpdesk_phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  হেল্পডেস্ক ইমেইল
                </label>
                <input
                  type="email"
                  value={settingsData.helpdesk_email}
                  onChange={(e) => setSettingsData({ ...settingsData, helpdesk_email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সার্চ রেট লিমিট (প্রতি আইপি থেকে প্রতি মিনিটে সর্বোচ্চ অনুরোধ)
              </label>
              <input
                type="number"
                value={settingsData.rate_limit_per_minute}
                onChange={(e) => setSettingsData({ ...settingsData, rate_limit_per_minute: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs max-w-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                সেটিংস সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
