import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronRight,
  CreditCard,
  ArrowLeft,
  Loader2,
  Lock,
  BarChart2,
  MapPin,
  Building2,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useRazorpay } from '../hooks/useRazorpay';
import { mockDbService } from '../services/mockFirebase';
import { generateServiceId } from '../utils/helpers';
import { UserProfile, UserRole } from '../types';

interface Service {
  id: string;
  name: string;
  fee: number;
  desc: string;
  tag?: 'Popular' | 'Free' | 'New';
  path: string; // e.g., '/services/gst-registration'
}

interface ServiceHubProps {
  user: UserProfile;
}

const ServiceHub: React.FC<ServiceHubProps> = ({ user }) => {
  const navigate = useNavigate();
  const { displayRazorpay } = useRazorpay();

  // View states
  const [isAdminView, setIsAdminView] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'recommended' | 'company-setup' | 'licenses-certificates' | 'tax-compliance' | 'trademark-ip'
  >('recommended');
  const [step, setStep] = useState<'select' | 'form' | 'payment'>('select');

  // Form & selection
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    panNumber: '',
    address: '',
    email: user.email || '',
    phone: user.phoneNumber || ''
  });

  // Admin analytics
  const [serviceStats, setServiceStats] = useState<any[]>([]);

  const isStaff = user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN;

  // All services (categorized)
  const categorizedServices: Record<string, Service[]> = {
    recommended: [
      { id: 'gst', name: 'GST Registration', fee: 1499, desc: 'Get your GSTIN within 7 days. Includes application filing and follow-up.', tag: 'Popular', path: '/services/gst-registration' },
      { id: 'pan', name: 'PAN Card Application', fee: 0, desc: 'Essential for tax filing. We handle the digital signature and form 49A.', tag: 'Popular', path: '/services/pan-registration' },
      { id: 'trademark', name: 'Trademark Registration', fee: 4999, desc: 'Protect your brand identity from competitors. Class search included.', tag: 'Popular', path: '/services/trademark' },
    ],
    'company-setup': [
      { id: 'msme', name: 'MSME Registration', fee: 0, desc: 'Udyam Registration for micro, small & medium enterprises.', tag: 'Free', path: '/services/msme-registration' },
      { id: 'startup', name: 'Startup India Registration', fee: 0, desc: 'DPIIT recognition with tax benefits & funding access.', tag: 'Free', path: '/services/startup-india' },
      { id: 'email-gstin', name: 'Email + GSTIN Combo', fee: 0, desc: 'Get business email & GSTIN in one go.', tag: 'Free', path: '/services/email-gstin-combo' },
      { id: 'gst', name: 'GST Registration', fee: 1499, desc: 'Get your GSTIN within 7 days. Includes application filing and follow-up.', tag: 'Popular', path: '/services/gst-registration' },
    ],
    'licenses-certificates': [
      { id: 'pan', name: 'PAN Card Application', fee: 999, desc: 'Essential for tax filing. We handle the digital signature and form 49A.', tag: 'Popular', path: '/services/pan-registration' },
      { id: 'trade-license', name: 'Trade License', fee: 0, desc: 'Mandatory for retail & wholesale businesses in most municipalities.', tag: 'Free', path: '/services/trade-license' },
      { id: 'fssai-basic', name: 'FSSAI License (Basic)', fee: 0, desc: 'Mandatory for food business operators with turnover < ₹12L/year.', tag: 'Free', path: '/services/fssai-license' },
      { id: 'dsc', name: 'DSC (e-Mudhra)', fee: 0, desc: 'Digital Signature Certificate for e-filing & authentication.', tag: 'Free', path: '/services/dsc-emudhra' },
    ],
    'tax-compliance': [
      { id: 'professional-tax', name: 'Professional Tax Registration', fee: 0, desc: 'Mandatory for salaried individuals & professionals in applicable states.', tag: 'Free', path: '/services/professional-tax' },
      { id: 'itr', name: 'ITR Filing', fee: 0, desc: 'Annual income tax return filing for individuals & businesses.', tag: 'Free', path: '/services/itr-filing' },
      { id: 'tds', name: 'TDS Return Filing', fee: 0, desc: 'Quarterly TDS returns for employers & deductors.', tag: 'Free', path: '/services/tds-return' },
    ],
    'trademark-ip': [
      { id: 'trademark', name: 'Trademark Registration', fee: 4999, desc: 'Protect your brand identity from competitors. Class search included.', tag: 'Popular', path: '/services/trademark' },
      { id: 'trademark-search', name: 'Trademark Search', fee: 0, desc: 'Comprehensive search across IP India database before filing.', tag: 'Free', path: '/services/trademark-search' },
    ]
  };

  // Fetch stats only if admin
  useEffect(() => {
    if (isStaff) {
      fetchStats();
    }
  }, [user.role]);

  const fetchStats = async () => {
    try {
      const allDocs = await mockDbService.getAllDocuments();
      const flatServices = Object.values(categorizedServices).flat();

      const stats = flatServices.map(srv => {
        const relevantDocs = allDocs.filter(d => d.doc.type === srv.id);
        const total = relevantDocs.length;
        const completed = relevantDocs.filter(d => d.doc.status === 'approved').length;
        const processing = relevantDocs.filter(d => d.doc.status === 'processing').length;

        const geo = [
          { state: 'Tamil Nadu', count: Math.floor(total * 0.4) },
          { state: 'Karnataka', count: Math.floor(total * 0.3) },
          { state: 'Maharashtra', count: Math.floor(total * 0.2) },
          { state: 'Others', count: Math.ceil(total * 0.1) }
        ];

        return {
          ...srv,
          total,
          completed,
          processing,
          geo
        };
      });
      setServiceStats(stats);
    } catch (e) {
      console.error("Stats error", e);
    }
  };

  const handleServiceSelect = (service: Service) => {
    navigate(service.path);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedService) {
      setStep('payment');
    }
  };

  const handlePayment = () => {
    if (!selectedService) return;

    displayRazorpay(selectedService.fee, async (response) => {
      setLoading(true);
      try {
        const docId = `DOC-${Date.now()}`;
        const serviceId = generateServiceId(selectedService.id.toUpperCase());
        await mockDbService.createDocument({
          id: docId,
          type: selectedService.id as 'gst' | 'pan' | 'trademark' | 'fssai' | 'msme',
          title: selectedService.name,
          serviceId: serviceId,
          status: 'paid',
          submittedAt: Date.now(),
          formData: { ...formData, paymentId: response.razorpay_payment_id },
          userId: user.uid,
          amount: selectedService.fee,
          folderId: 'regibiz'
        });

        alert('Application Submitted & Payment Successful!');
        setStep('select');
        setSelectedService(null);
        setFormData({
          businessName: '',
          panNumber: '',
          address: '',
          email: user.email || '',
          phone: user.phoneNumber || ''
        });
      } catch (err) {
        console.error(err);
        alert('Error saving document');
      } finally {
        setLoading(false);
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'company-setup':
        return <Building2 className="h-5 w-5" />;
      case 'tax-compliance':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'licenses-certificates':
        return <ShieldCheck className="h-5 w-5" />;
      case 'trademark-ip':
        return <Tag className="h-5 w-5" />;
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const getServicesForTab = () => {
    return categorizedServices[activeTab] || [];
  };

  // --- ADMIN ANALYTICS VIEW ---
  if (isAdminView) {
    return (
      <div className="p-6 md:p-8 animate-fade-in pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gradient-heading">Services Analytics</h2>
            <p className="text-gray-400 text-sm">Performance tracking across all compliance products.</p>
          </div>
          <button 
            onClick={() => setIsAdminView(false)} 
            className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Switch to Application Mode
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {serviceStats.map(stat => (
            <div key={stat.id} className="glass-card rounded-xl p-6 border border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{stat.name}</h3>
                    <p className="text-xs text-gray-500">Fee: ₹{stat.fee.toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-white">{stat.total}</span>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Completion Rate</span>
                  <span>{stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500" 
                    style={{ width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex items-center gap-1"><MapPin size={10} /> Top States</p>
                  <div className="space-y-1">
                    {stat.geo.slice(0, 3).map((g: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-gray-300">
                        <span>{g.state}</span>
                        <span className="font-mono text-gray-500">{g.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex items-center gap-1"><BarChart2 size={10} /> Status</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-amber-400">Processing</span>
                      <span className="text-white">{stat.processing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Completed</span>
                      <span className="text-white">{stat.completed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- CUSTOMER VIEW ---
  return (
    <div className="p-6 md:p-8 animate-fade-in pb-20">
      {step === 'select' && (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gradient-heading mb-1">Compliance Services</h2>
              <p className="text-gray-400">Select a service to begin your application.</p>
            </div>
            {isStaff && (
              <button 
                onClick={() => setIsAdminView(true)} 
                className="px-4 py-2 border border-orange-500/30 text-orange-400 rounded-lg text-sm hover:bg-orange-500/10 transition-colors flex items-center gap-2"
              >
                <BarChart2 size={16} /> View Analytics
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6">
            {Object.entries({
              recommended: 'Recommended',
              'company-setup': 'Company Setup',
              'licenses-certificates': 'Licenses & Certificates',
              'tax-compliance': 'Tax Compliance',
              'trademark-ip': 'Trademark & IP'
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {getServicesForTab().map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="glass-card rounded-xl p-6 cursor-pointer group relative overflow-hidden border border-white/5 hover:border-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Briefcase size={80} />
                </div>

                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-lg bg-navy-900/50 border border-white/10 flex items-center justify-center mr-3 text-emerald-500">
                    {getCategoryIcon(activeTab)}
                  </div>
                  {service.tag && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      service.tag === 'Popular' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-gray-600/50 text-gray-300'
                    }`}>
                      {service.tag}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {service.name}
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-2">
                  {service.desc}
                </p>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Govt Fees + Service</p>
                    <span className="text-lg font-bold text-white">
                      {service.fee > 0 ? `₹${service.fee.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getServicesForTab().length === 0 && (
            <div className="text-center py-12 glass-card rounded-xl border border-white/5">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Services Available</h3>
              <p className="text-gray-400 mb-6">There are no services available in this category at the moment.</p>
              <button 
                onClick={() => setActiveTab('recommended')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
              >
                View Recommended Services
              </button>
            </div>
          )}
        </>
      )}

      {/* FORM STEP */}
      {step === 'form' && selectedService && (
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setStep('select')} className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Back to Services
          </button>
          
          <div className="glass-panel rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-gradient-heading mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm">1</span>
              Details for {selectedService.name}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Legal Business Name</label>
                  <input required type="text" className="w-full bg-navy-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all" 
                    value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">PAN Number</label>
                  <input required type="text" className="w-full bg-navy-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all uppercase" 
                     value={formData.panNumber} onChange={e => setFormData({...formData, panNumber: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Registered Office Address</label>
                <textarea required rows={3} className="w-full bg-navy-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all" 
                   value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-orange-500/20">
                  Proceed to Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT STEP */}
      {step === 'payment' && selectedService && (
        <div className="max-w-md mx-auto mt-10 animate-fade-in relative z-10">
          <div className="bg-[#0A0F25] rounded-3xl p-8 border border-white/5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-[#FF6B35] to-[#FF4757] opacity-80 blur-[2px]"></div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FF4757]/10 mb-5 border border-[#FF6B35]/20 shadow-lg shadow-orange-500/10">
                <CreditCard className="text-[#FF6B35]" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-[#4DD6E8] tracking-tight mb-2 font-sans">Payment Gateway</h3>
              <p className="text-sm text-[#A0AEC0] font-normal">Secure transaction via Razorpay</p>
            </div>

            <div className="bg-[#1A202C] rounded-full px-6 py-4 mb-8 flex justify-between items-center shadow-inner border border-white/5">
              <span className="text-white font-medium text-base truncate pr-4">{selectedService.name}</span>
              <span className="text-white font-medium text-base whitespace-nowrap">₹{selectedService.fee.toLocaleString()}</span>
            </div>

            <button 
              onClick={handlePayment} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF4757] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Pay Now'}
            </button>
            
            <div className="text-center mt-4">
              <button onClick={() => setStep('form')} className="text-sm text-[#A0AEC0] hover:text-white transition-colors font-normal">
                Cancel Transaction
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center text-center gap-2">
              <div className="flex items-center gap-1.5 text-[#4A5568]">
                <Lock size={12} />
                <span className="text-xs font-light tracking-wide">Secured by 256-bit Encryption</span>
              </div>
              <p className="text-[10px] text-[#4A5568] font-light">RegiBIZ v2.0.1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHub;