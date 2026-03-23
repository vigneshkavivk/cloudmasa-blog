// src/pages/services/startup-india/form.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRazorpay } from '../hooks/useRazorpay';
import { mockDbService } from './mockFirebase';
import { generateServiceId } from '../utils/helpers';
import {
  Building,
  FileText,
  File,
  AlertTriangle,
  Loader2,
  CheckCircle,
  User,
  MapPin,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ExternalLink,
  Activity
} from 'lucide-react';

// --- Validators ---
const validators = {
  required: (value) => value.trim().length > 0 || "This field is required",
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
  mobile: (value) => /^[6-9]\d{9}$/.test(value) || "Enter a valid 10-digit mobile number",
  pan: (value) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value) || "Invalid PAN format (e.g., ABCDE1234F)",
  cin: (value) => {
    if (!value.trim()) return "CIN/LLPIN is required";
    // Basic CIN format: LNNNNNNNNNNNNNNN (1 letter + 20 alphanumeric)
    // LLPIN format: AAAAAAAAAAAAAAAA (8 alphanumeric + 4 numeric + 2 alphanumeric)
    return (/^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(value) || 
            /^[A-Z]{5}\d{4}[A-Z]{3}\d{5}[A-Z]{1}\d{1}$/.test(value) || 
            /^[A-Z0-9]{8}\d{4}[A-Z0-9]{2}$/.test(value)) || 
           "Invalid CIN/LLPIN format";
  },
  pincode: (value) => /^\d{6}$/.test(value) || "Enter valid 6-digit pincode",
  incorporationDate: (value) => {
    if (!value) return "Incorporation date is required"; 
    const date = new Date(value);
    const now = new Date();
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    return (date <= now && date >= tenYearsAgo) || "Must be within last 10 years";
  },
  innovationDesc: (value) => {
    const words = value.trim().split(/\s+/).filter(Boolean).length;
    return (words >= 20 && words <= 500) || "Describe your innovation in 20–500 words";
  },
  nicCode: (value) => /^\d{5}$/.test(value) || "Enter valid 5-digit NIC code",
  url: (value) => {
    if (!value.trim()) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return "Enter valid URL (e.g., https://yourstartup.com)";
    }
  }
};

// --- Status Banner ---
const StatusBanner = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-lg mb-8 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
      <div className="z-10 mb-2 sm:mb-0">
        <div className="flex items-baseline space-x-3">
          <span className="text-slate-500 font-medium line-through text-lg">₹1,499</span>
          <span className="text-emerald-400 font-bold text-2xl tracking-tight drop-shadow-sm">Free</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">DPIIT Recognized</span>
        </div>
        <p className="text-slate-400 text-sm mt-1 font-medium">Zero professional fees • Govt-recognized</p>
      </div>
      <div className="text-left sm:text-right z-10">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case Reference</p>
        <p className="text-slate-200 font-mono font-medium text-sm md:text-base">STARTUP-2026-{Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
      </div>
    </div>
  );
};

// --- Form Components ---
const FormInput = ({ label, error, hint = '', optional, className, id, required = false, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-200 transition-colors group-focus-within:text-sky-400">
          {label} {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
        {optional && <span className="text-xs text-slate-500 font-medium">Optional</span>}
      </div>
      <div className="relative">
        <input
          id={inputId}
          className={`w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 placeholder-slate-500 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none ${
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600'
          } ${className || ''}`}
          aria-invalid={!!error}
          required={required}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 font-mono">{hint}</p>
      ) : null}
    </div>
  );
};

const FormTextarea = ({ label, error, required, ...props }) => {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <textarea
        id={id}
        className={`w-full bg-slate-800/50 border text-white text-sm rounded-lg p-3 placeholder-slate-500 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none min-h-[120px] ${
          error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600'
        }`}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

const FormSelect = ({ label, options, error, optional, id, required, value, ...props }) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-200 transition-colors group-focus-within:text-sky-400">
          {label} {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
        {optional && <span className="text-xs text-slate-500 font-medium">Optional</span>}
      </div>
      <div className="relative">
        <select
          id={selectId}
          className={`w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 pr-10 appearance-none placeholder-slate-400 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none cursor-pointer ${
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600'
          } ${!value ? 'text-slate-500' : 'text-white'}`}
          required={required}
          value={value}
          {...props}
        >
          <option value="" disabled>{!value ? `Select ${label.toLowerCase()}` : ''}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900 bg-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

const FileUploader = ({ label, name, accept = ".pdf,.jpg,.jpeg,.png", onChange, required }) => {
  const [fileName, setFileName] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    processFile(file);
  };

  const processFile = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit');
        return;
      }
      setFileName(file.name);
      onChange(file);
    } else {
      setFileName(null);
      onChange(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    processFile(file);
  };

  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="block text-sm font-medium text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 ease-in-out cursor-pointer group ${
          isDragging ? 'border-sky-500 bg-sky-500/10' : fileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} name={name} accept={accept} className="hidden" onChange={handleFileChange} />
        <div className="flex items-center space-x-4">
          <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${fileName ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400 group-hover:text-sky-400'}`}>
            {fileName ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {fileName ? (
              <div>
                <p className="text-sm font-medium text-emerald-400 truncate">{fileName}</p>
                <p className="text-xs text-slate-400 mt-0.5">File ready for upload</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-500 mt-0.5">PDF, JPEG, PNG (Max 2MB)</p>
              </div>
            )}
          </div>
          {fileName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                onChange(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoSidebar = ({ formData, uploadedFiles, currentStep, onPreview }) => {
  const getStepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6 hidden lg:block">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl transition-all duration-300">
        <h3 className="text-white text-sm font-semibold mb-4 flex items-center">
          <span className="bg-sky-500/20 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          Progress Status
        </h3>
        <div className="relative border-l-2 border-slate-700/60 ml-2 space-y-6 my-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="ml-5 relative">
              <span
                className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-slate-800 transition-all duration-300 ${
                  getStepStatus(step) === 'completed'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : getStepStatus(step) === 'active'
                    ? 'bg-sky-500 ring-4 ring-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-110'
                    : 'bg-slate-700'
                }`}
              ></span>
              <h4
                className={`text-xs font-medium transition-colors ${
                  getStepStatus(step) === 'active'
                    ? 'text-white'
                    : getStepStatus(step) === 'completed'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {step === 1 ? 'Company Details' : 
                 step === 2 ? 'Business Info' : 
                 step === 3 ? 'Contact & Innovation' : 
                 'Docs & Verification'}
              </h4>
              <p className="text-slate-400 text-[10px] mt-0.5">
                {getStepStatus(step) === 'completed'
                  ? 'Completed'
                  : getStepStatus(step) === 'active'
                  ? 'In Progress'
                  : 'Pending'}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div
        className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl transition-opacity duration-300 ${
          currentStep === 4 ? 'opacity-100 ring-1 ring-emerald-500/30' : 'opacity-70'
        }`}
      >
        <h3 className="text-white text-sm font-semibold mb-3 flex items-center">
          <span className="bg-amber-500/20 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Required Documents
        </h3>
        <ul className="space-y-2.5">
          {[
            { label: 'Certificate of Incorporation', key: 'incorporationCert' },
            { label: 'PAN Card (Entity)', key: 'panCard' },
            { label: 'Director ID Proof', key: 'directorId' },
            { label: 'Pitch Deck / Business Plan', key: 'pitchDeck' },
          ].map((item, idx) => {
            const isUploaded = uploadedFiles[item.key];
            return (
              <li key={idx} className="flex items-center text-xs text-slate-300 justify-between group">
                <div className="flex items-center">
                  <div className={`mr-2.5 transition-all duration-500 ${isUploaded ? 'text-emerald-400 scale-110' : 'text-slate-600'}`}>
                    {isUploaded ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <span className={isUploaded ? 'text-emerald-100 transition-colors' : 'transition-colors'}>{item.label}</span>
                </div>
                {isUploaded && <span className="text-[10px] text-emerald-500/80 font-mono">READY</span>}
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
        <h3 className="text-white text-sm font-semibold mb-3 flex items-center">
          <span className="bg-rose-500/20 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          Help Desk
        </h3>
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
            <span>DPIIT Helpline</span>
            <span className="font-mono text-emerald-400 font-medium">1800-11-5566</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
            <span>Email</span>
            <span className="text-sky-400 font-medium">support@cloudmasa.com</span>
          </div>
        </div>
      </div>             
      
      <div className="pt-2 flex justify-center">
        <button
          onClick={onPreview}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-600/50 text-sky-400 font-bold tracking-wide shadow-lg hover:bg-slate-700 hover:text-white hover:border-sky-500/50 hover:shadow-sky-500/10 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview Application
        </button>
      </div>
    </div>
  );
};

// --- Main Form ---
const StartupIndiaRegistrationForm = ({ user }) => {
  const navigate = useNavigate();
  const { displayRazorpay } = useRazorpay();
  
  // Enhanced form data with all DPIIT-required fields
  const [formData, setFormData] = useState({
    // Step 1: Company Details
    companyName: '',
    entity: '',
    incorporationDate: '',
    cinOrLlpin: '',
    pan: '',
    gst: '',
    
    // Step 2: Business Details
    address: '',
    state: '',
    district: '',
    pincode: '',
    sector: '',
    nicCode: '',
    startupStage: '',
    businessModel: '',
    
    // Step 3: Contact & Innovation
    email: '',
    mobile: '',
    website: '',
    directorName: '',
    directorDin: '',
    directorPan: '',
    innovationDesc: '',
    
    // Step 4: Declaration
    selfCertified: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState({
    incorporationCert: false,
    panCard: false,
    directorId: false,
    pitchDeck: false,
  });
  const [captcha, setCaptcha] = useState({ val1: 0, val2: 0, userAnswer: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Entity options
  const entityOptions = [
    { value: 'pvtltd', label: 'Private Limited Company' },
    { value: 'llp', label: 'Limited Liability Partnership' },
    { value: 'partnership', label: 'Registered Partnership Firm' },
    { value: 'opc', label: 'One Person Company' },
  ];
  
  // State options (top 10 states)
  const stateOptions = [
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'telangana', label: 'Telangana' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'haryana', label: 'Haryana' },
    { value: 'kerala', label: 'Kerala' },
    { value: 'west-bengal', label: 'West Bengal' },
    { value: 'punjab', label: 'Punjab' },
  ];
  
  // Startup stage options
  const stageOptions = [
    { value: 'idea', label: 'Idea Stage' },
    { value: 'prototype', label: 'Prototype Stage' },
    { value: 'mvp', label: 'MVP Stage' },
    { value: 'revenue', label: 'Revenue Generating' },
    { value: 'scaling', label: 'Scaling' },
  ];

  // Generate captcha
  const generateCaptcha = useCallback(() => {
    setCaptcha({ 
      val1: Math.floor(Math.random() * 10) + 1, 
      val2: Math.floor(Math.random() * 10) + 1, 
      userAnswer: '' 
    });
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Handle file uploads
  const handleFileUpload = (key) => (file) => {
    setUploadedFiles(prev => ({ ...prev, [key]: !!file }));
  };

  // Validate field
  const validateField = (name, value) => {
    switch (name) {
      case 'companyName':
      case 'address':
      case 'directorName':
      case 'businessModel':
        return validators.required(value);
      case 'entity':
      case 'state':
      case 'startupStage':
        return value ? true : "This field is required";
      case 'incorporationDate':
        return validators.incorporationDate(value);
      case 'pan':
      case 'directorPan':
        return validators.pan(value);
      case 'cinOrLlpin':
        return validators.cin(value);
      case 'email':
        return validators.email(value);
      case 'mobile':
        return validators.mobile(value);
      case 'pincode':
        return validators.pincode(value);
      case 'nicCode':
        return validators.nicCode(value);
      case 'website':
        return validators.url(value);
      case 'innovationDesc':
        return validators.innovationDesc(value);
      default:
        return true;
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Format specific fields
    let formattedValue = newValue;
    if (['pan', 'directorPan'].includes(name)) {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }
    if (name === 'mobile') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    if (name === 'pincode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 6);
    }
    if (name === 'nicCode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 5);
    }
    if (name === 'cinOrLlpin') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 21);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Validate if field was already touched
    if (touched[name]) {
      const error = validateField(name, formattedValue);
      setErrors(prev => ({ ...prev, [name]: error === true ? '' : error }));
    }
  };

  // Handle blur (mark field as touched and validate)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error === true ? '' : error }));
  };

  // Get fields for current step
  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return ['companyName', 'entity', 'incorporationDate', 'cinOrLlpin', 'pan', 'gst'];
      case 2:
        return ['address', 'state', 'district', 'pincode', 'sector', 'nicCode', 'startupStage', 'businessModel'];
      case 3:
        return ['email', 'mobile', 'website', 'directorName', 'directorDin', 'directorPan', 'innovationDesc'];
      case 4:
        return ['selfCertified'];
      default:
        return [];
    }
  };

  // Validate current step
  const validateCurrentStep = () => {
    const fields = getStepFields(currentStep);
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(key => {
      // Skip selfCertified for now (handle separately)
      if (key === 'selfCertified') return;
      
      const error = validateField(key, formData[key]);
      if (error !== true) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    
    // Special validation for Step 4 declaration
    if (currentStep === 4 && !formData.selfCertified) {
      newErrors.selfCertified = "You must accept the declaration to proceed";
      isValid = false;
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(prev => {
      const touchedFields = { ...prev };
      fields.forEach(f => touchedFields[f] = true);
      return touchedFields;
    });
    
    return isValid;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateCurrentStep()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(prev => prev - 1);
  };

  // Submit handler
  const handleSubmit = async () => {
    // Final validation
    if (!validateCurrentStep()) return;
    
    // Check all documents uploaded
    const allUploaded = Object.values(uploadedFiles).every(Boolean);
    if (!allUploaded) {
      alert('Please upload all required documents before submission.');
      return;
    }
    
    // Verify captcha
    if (parseInt(captcha.userAnswer) !== captcha.val1 + captcha.val2) {
      alert('Incorrect security verification. Please solve the math problem correctly.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Free service - skip payment, go straight to submission
      const docId = `DOC-${Date.now()}`;
      
      await mockDbService.createDocument({
        id: docId,
        type: 'legal',
        title: 'Startup India Registration',
        serviceId: generateServiceId('STARTUPINDIA'),
        status: 'submitted',
        submittedAt: Date.now(),
        formData: {
          ...formData,
          uploadedFiles: Object.keys(uploadedFiles).filter(key => uploadedFiles[key]),
        },
        userId: user.uid,
        folderId: ''
      });
      
      // Show success message and redirect after delay
      setIsSubmitting(false);
      alert('✅ Application submitted successfully!\n\nYour Startup India DPIIT recognition application has been received. You will receive a confirmation email shortly with your application reference number.');
      
      // Redirect to dashboard/services page
      navigate('/dashboard/services');
      
    } catch (err) {
      console.error('Submission failed:', err);
      setIsSubmitting(false);
      alert('Submission failed. Please try again or contact support.');
    }
  };

  // Preview Modal
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Application Preview</h3>
              <p className="text-xs text-slate-400">Complete DPIIT Recognition Application</p>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Company Section */}
          <section>
            <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Company Registration Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Legal Name</p>
                <p className="text-white font-medium truncate">{formData.companyName || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Entity Type</p>
                <p className="text-white font-medium">
                  {entityOptions.find(o => o.value === formData.entity)?.label || '—'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">CIN / LLPIN</p>
                <p className="text-white font-medium font-mono">{formData.cinOrLlpin || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">PAN</p>
                <p className="text-white font-medium font-mono">{formData.pan || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">GSTIN</p>
                <p className="text-white font-medium font-mono">{formData.gst || 'Not Provided'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Incorporation Date</p>
                <p className="text-white font-medium">
                  {formData.incorporationDate
                    ? new Date(formData.incorporationDate).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </section>
          
          {/* Business Section */}
          <section>
            <h4 className="font-semibold text-sky-400 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Business Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Registered Address</p>
                <p className="text-white font-medium">{formData.address || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">State & District</p>
                <p className="text-white font-medium">
                  {formData.state ? stateOptions.find(s => s.value === formData.state)?.label : '—'}, {formData.district || '—'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Pincode</p>
                <p className="text-white font-medium">{formData.pincode || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Sector</p>
                <p className="text-white font-medium">{formData.sector || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">NIC Code</p>
                <p className="text-white font-medium font-mono">{formData.nicCode || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Startup Stage</p>
                <p className="text-white font-medium">
                  {stageOptions.find(s => s.value === formData.startupStage)?.label || '—'}
                </p>
              </div>
              <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Business Model</p>
                <p className="text-white font-medium">{formData.businessModel || '—'}</p>
              </div>
            </div>
          </section>
          
          {/* Contact & Innovation */}
          <section>
            <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact & Innovation Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Official Email</p>
                <p className="text-white font-medium truncate">{formData.email || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Mobile Number</p>
                <p className="text-white font-medium">{formData.mobile || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Website</p>
                <p className="text-sky-400 font-medium truncate">
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {formData.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Director / Partner</p>
                <p className="text-white font-medium">{formData.directorName || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Director DIN</p>
                <p className="text-white font-medium font-mono">{formData.directorDin || '—'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Director PAN</p>
                <p className="text-white font-medium font-mono">{formData.directorPan || '—'}</p>
              </div>
              <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Innovation Description</p>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                  {formData.innovationDesc.trim() || 'No innovation summary provided.'}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{formData.innovationDesc.trim() ? `${formData.innovationDesc.split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
                  <span>Required: 20–500 words</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Documents Section */}
          <section>
            <h4 className="font-semibold text-rose-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Uploaded Documents
            </h4>
            <div className="space-y-3">
              {[
                { key: 'incorporationCert', label: 'Certificate of Incorporation', icon: <FileText className="w-4 h-4" /> },
                { key: 'panCard', label: 'PAN Card (Entity)', icon: <FileText className="w-4 h-4" /> },
                { key: 'directorId', label: 'Director ID Proof', icon: <User className="w-4 h-4" /> },
                { key: 'pitchDeck', label: 'Pitch Deck / Business Plan', icon: <File className="w-4 h-4" /> },
              ].map((doc) => {
                const isReady = uploadedFiles[doc.key];
                return (
                  <div
                    key={doc.key}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isReady
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-700/50 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {doc.icon}
                      </div>
                      <span className="text-white font-medium">{doc.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isReady ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
          {/* Declaration */}
          <section className="pt-4 border-t border-slate-800/50">
            <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <div className="mt-1 p-1.5 bg-emerald-500/10 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h5 className="font-semibold text-white">Self Declaration</h5>
                <p className="text-xs text-slate-300 mt-1">
                  "I hereby declare that the information provided is true, correct and complete to the best of my knowledge and belief. I understand that any false information may lead to rejection of my application or cancellation of recognition."
                </p>
                <div className="mt-3 flex items-center">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    formData.selfCertified 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'border-slate-500'
                  }`}>
                    {formData.selfCertified && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-300 ml-2">
                    {formData.selfCertified ? 'Declaration accepted' : 'Declaration not accepted'}
                  </span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Security Verification */}
          <section className="pt-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h5 className="font-semibold text-white">Security Verification</h5>
                  <p className="text-xs text-slate-400 mt-1">
                    CAPTCHA: {captcha.val1} + {captcha.val2} = {captcha.userAnswer || '?'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {captcha.userAnswer === `${captcha.val1 + captcha.val2}` ? (
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                    Verified ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </section>
          
          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-800/50">
            <p className="text-xs text-slate-500 leading-relaxed">
              🔐 This preview shows your complete application. All information will be submitted to DPIIT for official recognition. Documents are encrypted and stored securely per ISO 27001 standards. Application reference: <span className="text-emerald-400 font-mono">STARTUP-2026-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </p>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="p-6 bg-slate-800/50 border-t border-slate-700/50 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => setShowPreview(false)}
            className="px-5 py-2.5 text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            Edit Details
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !Object.values(uploadedFiles).every(Boolean) ||
              !formData.selfCertified ||
              captcha.userAnswer !== `${captcha.val1 + captcha.val2}`
            }
            className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : Object.values(uploadedFiles).every(Boolean) && 
                  formData.selfCertified && 
                  captcha.userAnswer === `${captcha.val1 + captcha.val2}`
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Submitting Application...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Submit for DPIIT Recognition
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] to-[#0a192f] p-4 sm:p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="lg:hidden mb-6 text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">Startup India Registration</h1>
          <p className="text-sky-200/80 text-sm">Step {currentStep} of 4</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <main className="lg:col-span-7 xl:col-span-8 glass-panel rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden relative min-h-[600px] flex flex-col">
            <div className="p-6 md:p-10 flex-grow">
              <div className="text-center mb-8 hidden lg:block">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">Startup India Registration</h1>
                <p className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed">
                  {currentStep === 1 && 'Provide your company\'s legal registration details including CIN/LLPIN.'}
                  {currentStep === 2 && 'Enter business details including sector, NIC code, and registered address.'}
                  {currentStep === 3 && 'Provide contact information and describe your innovation.'}
                  {currentStep === 4 && 'Upload required documents and accept declaration for DPIIT submission.'}
                </p>
              </div>
              
              <StatusBanner />
              
              <form noValidate className="grid grid-cols-1 gap-y-10">
                {/* Step 1: Company Details */}
                {currentStep === 1 && (
                  <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                      <span className="bg-sky-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]"></span>
                      Company Registration Details
                    </legend>
                    
                    <FormInput
                      label="Legal Company Name"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.companyName}
                      placeholder="e.g., Innovate Labs Pvt Ltd"
                      required
                      autoFocus
                      optional={false}
                      className=""
                      id="companyName"
                    />
                    
                    <FormSelect
                      label="Entity Type"
                      name="entity"
                      value={formData.entity}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.entity}
                      options={entityOptions}
                      required
                      id="entity"
                      optional={false}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        type="date"
                        label="Date of Incorporation"
                        name="incorporationDate"
                        value={formData.incorporationDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.incorporationDate}
                        required={true}
                        optional={false}
                        className=""
                        id="incorporationDate"
                      />
                      
                      <FormInput
                        label="CIN / LLPIN"
                        name="cinOrLlpin"
                        value={formData.cinOrLlpin}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.cinOrLlpin}
                        placeholder="e.g., U72900MH2020PTC123456"
                        hint="Enter your MCA-issued registration number"
                        required={true}
                        optional={false}
                        className=""
                        id="cinOrLlpin"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="PAN"
                        name="pan"
                        value={formData.pan}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.pan}
                        placeholder="ABCDE1234F"
                        hint="Format: ABCDE1234F"
                        maxLength={10}
                        required={true}
                        optional={false}
                        className=""
                        id="pan"
                      />
                      
                      <FormInput
                        label="GSTIN"
                        name="gst"
                        value={formData.gst}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.gst}
                        placeholder="22AAAAA0000A1Z5"
                        hint="Optional but recommended"
                        optional={true}
                        className=""
                        id="gst"
                        required={false}
                      />
                    </div>
                  </fieldset>
                )}
                
                {/* Step 2: Business Details */}
                {currentStep === 2 && (
                  <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                      <span className="bg-purple-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                      Business Information
                    </legend>
                    
                    <FormTextarea
                      label="Registered Office Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.address}
                      placeholder="Full address including building name, street, city"
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormSelect
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.state}
                        options={stateOptions}
                        required
                        id="state"
                        optional={false}
                      />
                      
                      <FormInput
                        label="District"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.district}
                        placeholder="e.g., Bangalore Urban"
                        required
                        optional={false}
                        className=""
                        id="district"
                      />
                      
                      <FormInput
                        label="Pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.pincode}
                        placeholder="600001"
                        maxLength={6}
                        required
                        optional={false}
                        className=""
                        id="pincode"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="Business Sector"
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.sector}
                        placeholder="e.g., Fintech, Healthtech, Edtech"
                        required
                        optional={false}
                        className=""
                        id="sector"
                      />
                      
                      <FormInput
                        label="NIC Code"
                        name="nicCode"
                        value={formData.nicCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.nicCode}
                        placeholder="90301"
                        hint="5-digit National Industrial Classification code"
                        maxLength={5}
                        required
                        optional={false}
                        className=""
                        id="nicCode"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormSelect
                        label="Startup Stage"
                        name="startupStage"
                        value={formData.startupStage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.startupStage}
                        options={stageOptions}
                        required
                        id="startup-stage"
                        optional={false}
                      />
                      
                      <FormInput
                        label="Business Model"
                        name="businessModel"
                        value={formData.businessModel}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.businessModel}
                        placeholder="B2B SaaS, D2C E-commerce, Marketplace, etc."
                        required
                        optional={false}
                        className=""
                        id="businessModel"
                      />
                    </div>
                  </fieldset>
                )}
                
                {/* Step 3: Contact & Innovation */}
                {currentStep === 3 && (
                  <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                      <span className="bg-emerald-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                      Contact & Innovation
                    </legend>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        type="email"
                        label="Official Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        placeholder="contact@yourstartup.com"
                        required
                        autoFocus
                        optional={false}
                        className=""
                        id="email"
                      />
                      
                      <FormInput
                        type="tel"
                        label="Mobile Number"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.mobile}
                        placeholder="9876543210"
                        maxLength={10}
                        required
                        optional={false}
                        className=""
                        id="mobile"
                      />
                    </div>
                    
                    <FormInput
                      type="url"
                      label="Website / Pitch URL"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.website}
                      placeholder="https://yourstartup.com"
                      hint="Optional but recommended for verification"
                      optional={true}
                      className=""
                      id="website"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="Director / Partner Name"
                        name="directorName"
                        value={formData.directorName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.directorName}
                        placeholder="Full legal name as per DIN"
                        required
                        optional={false}
                        className=""
                        id="directorName"
                      />
                      
                      <FormInput
                        label="Director DIN / DPIN"
                        name="directorDin"
                        value={formData.directorDin}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.directorDin}
                        placeholder="01234567"
                        hint="Director Identification Number"
                        required
                        optional={false}
                        className=""
                        id="directorDin"
                      />
                    </div>
                    
                    <FormInput
                      label="Director PAN"
                      name="directorPan"
                      value={formData.directorPan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.directorPan}
                      placeholder="ABCDE1234F"
                      hint="PAN of authorized signatory"
                      maxLength={10}
                      required
                      optional={false}
                      className=""
                      id="directorPan"
                    />
                    
                    <FormTextarea
                      label="Innovation Description"
                      name="innovationDesc"
                      value={formData.innovationDesc}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.innovationDesc}
                      placeholder="Explain how your product/service is innovative, scalable, and solves a real problem (20–500 words)"
                      required
                    />
                  </fieldset>
                )}
                
                {/* Step 4: Documents & Declaration */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <fieldset className="space-y-4 mb-8">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                        <span className="bg-amber-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                        Document Uploads
                      </legend>
                      
                      <div className="grid grid-cols-1 gap-5">
                        <FileUploader
                          label="Certificate of Incorporation"
                          name="incorporationCert"
                          required
                          onChange={handleFileUpload('incorporationCert')}
                        />
                        
                        <FileUploader
                          label="PAN Card of Entity"
                          name="panCard"
                          required
                          onChange={handleFileUpload('panCard')}
                        />
                        
                        <FileUploader
                          label="Director ID Proof (Aadhaar/PAN/Passport)"
                          name="directorId"
                          required
                          onChange={handleFileUpload('directorId')}
                        />
                        
                        <FileUploader
                          label="Pitch Deck / Business Plan (PDF)"
                          name="pitchDeck"
                          accept=".pdf"
                          required
                          onChange={handleFileUpload('pitchDeck')}
                        />
                      </div>
                    </fieldset>
                    
                    {/* Declaration */}
                    <fieldset className="space-y-4 mb-8 p-5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 mr-2" />
                        Self Declaration
                      </legend>
                      
                      <div className="text-sm text-slate-300 space-y-3 mb-4">
                        <p>
                          I hereby declare that:
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                          <li>The startup is working towards innovation, development or improvement of products or processes</li>
                          <li>The startup is not formed by splitting up or reconstruction of a business already in existence</li>
                          <li>The startup has not exceeded 10 years from the date of incorporation/registration</li>
                          <li>The turnover has not exceeded ₹100 crore in any financial year</li>
                          <li>All information provided is true, correct and complete to the best of my knowledge</li>
                        </ul>
                      </div>
                      
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="selfCertified"
                          checked={formData.selfCertified}
                          onChange={handleChange}
                          className="w-5 h-5 mt-1 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2"
                        />
                        <span className="text-slate-300 group-hover:text-white transition-colors">
                          I accept the declaration and confirm all information provided is accurate
                        </span>
                      </label>
                      
                      {errors.selfCertified && (
                        <p className="mt-2 text-xs text-red-400 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.selfCertified}
                        </p>
                      )}
                    </fieldset>
                    
                    {/* CAPTCHA */}
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                      <h4 className="text-sm font-semibold text-white flex items-center mb-3">
                        <svg className="w-4 h-4 mr-2 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Security Verification
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        Please solve the math problem to verify you are human
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-700 font-mono text-xl font-bold text-sky-400 tracking-wider min-w-[120px] text-center">
                            {captcha.val1} + {captcha.val2} = ?
                          </div>
                          
                          <input
                            type="number"
                            className="w-24 bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-center text-white text-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition-all"
                            placeholder="Answer"
                            value={captcha.userAnswer}
                            onChange={(e) => setCaptcha({ ...captcha, userAnswer: e.target.value })}
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className="p-2.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Refresh Verification"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 px-6 md:px-10 pb-8">
              <div className="flex flex-col-reverse md:flex-row items-center gap-4 justify-between">
                <div className="w-full md:w-auto flex gap-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="w-full md:w-auto px-6 py-4 rounded-xl font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                </div>
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg bg-sky-500 text-white hover:bg-sky-400 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Next Step
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all duration-300 transform ${
                      isSubmitting
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-70 border border-slate-700'
                        : 'bg-emerald-500/90 text-white hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:translate-y-0 backdrop-blur-sm'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        Processing Application...
                      </span>
                    ) : (
                      'Submit for DPIIT Recognition'
                    )}
                  </button>
                )}
              </div>
              
              <p className="mt-4 text-center text-xs text-slate-400">
                Step {currentStep} of 4 — By submitting, you agree to{' '}
                <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                  Startup India Terms
                </a>{' '}
                and{' '}
                <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                  Privacy Policy
                </a>
                . This is a free government-recognized service.
              </p>
            </div>
          </main>
          
          <aside className="lg:col-span-5 xl:col-span-4 sticky top-8">
            <InfoSidebar
              formData={formData}
              uploadedFiles={uploadedFiles}
              currentStep={currentStep}
              onPreview={() => setShowPreview(true)}
            />
          </aside>
        </div>
        
        <div className="mt-12 text-center text-slate-500 text-sm pb-8">
          &copy; {new Date().getFullYear()} RegiBIZ. In partnership with DPIIT, Ministry of Commerce & Industry, Government of India.
        </div>
      </div>
      
      {showPreview && <PreviewModal />}
    </div>
  );
};

export default StartupIndiaRegistrationForm;