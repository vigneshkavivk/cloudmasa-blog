// services/pan-registration-form.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useRazorpay } from '../hooks/useRazorpay';
import { mockDbService } from '../services/mockFirebase';
import { generateServiceId } from '../utils/helpers';
import SignatureQRSection from '../components/SignatureFlow/SignatureQRSection';


// --- Validators ---
const validators = {
  required: (value: string) => value.trim().length > 0 || "This field is required",
  name: (value: string) => /^[A-Za-z\s]{2,50}$/.test(value) || "Enter a valid name (letters and spaces only)",
  dob: (value: string) => {
    if (!value.trim()) return "Date of birth is required";
    const parts = value.split('/');
    if (parts.length !== 3) return "Enter date as DD/MM/YYYY";
    const [d, m, y] = parts.map(Number);
    const dob = new Date(y, m - 1, d);
    if (
      dob.getFullYear() !== y ||
      dob.getMonth() !== m - 1 ||
      dob.getDate() !== d
    ) {
      return "Enter a valid date (DD/MM/YYYY)";
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    return (age >= 18 && age <= 100) || "Applicant must be between 18 and 100 years old";
  },
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
  mobile: (value: string) => /^[6-9]\d{9}$/.test(value) || "Enter a valid 10-digit mobile number",
  aadhaar: (value: string) => /^\d{12}$/.test(value) || "Aadhaar must be 12 digits",
  otp: (value: string) => /^\d{6}$/.test(value) || "Enter a 6-digit OTP",
  pincode: (value: string) => /^\d{6}$/.test(value) || "Pincode must be 6 digits",
};

// --- Reusable Form Input Component ---
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, error, hint, optional, className = "", id, required, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const baseClasses = "w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 placeholder-slate-500 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none";
  const errorClasses = error
    ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
    : "border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600";
  const fullClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-200 transition-colors group-focus-within:text-sky-400">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {optional && <span className="text-xs text-slate-500 font-medium">Optional</span>}
      </div>
      <input
        id={inputId}
        className={fullClasses}
        aria-invalid={!!error}
        required={required}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 font-mono">{hint}</p>
      ) : null}
    </div>
  );
};

// --- Select Input Component ---
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, error, options, required, className = "", ...props }) => {
  const baseClasses = "w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none";
  const errorClasses = error
    ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
    : "border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600";
  const fullClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-slate-200 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select className={fullClasses} required={required} {...props}>
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
};

// --- File Uploader Component ---
const FileUploader: React.FC<{
  label: string;
  name: string;
  accept?: string;
  onChange: (file: File | null) => void;
  required?: boolean;
  hint?: string;
}> = ({ label, name, accept = ".pdf,.jpg,.jpeg,.png", onChange, required, hint }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    processFile(file);
  };

  const processFile = (file: File | null) => {
    if (file) {
      setFileName(file.name);
      onChange(file);
    } else {
      setFileName(null);
      onChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    processFile(file);
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-slate-200 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 ease-in-out cursor-pointer group ${
          isDragging
            ? 'border-sky-500 bg-sky-500/10'
            : fileName
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
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
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
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
                {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
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
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Status Banner Component ---
const StatusBanner: React.FC = () => (
  <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-lg mb-8 relative overflow-hidden backdrop-blur-sm">
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
    <div className="z-10 mb-2 sm:mb-0">
      <div className="flex items-baseline space-x-3">
        <span className="text-slate-500 font-medium line-through text-lg">₹399</span>
        <span className="text-emerald-400 font-bold text-2xl tracking-tight drop-shadow-sm">₹199</span>
        <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">Limited Offer</span>
      </div>
      <p className="text-slate-400 text-sm mt-1 font-medium">Fast-track processing included</p>
    </div>
    <div className="text-left sm:text-right z-10">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case Reference</p>
      <p className="text-slate-200 font-mono font-medium text-sm md:text-base">PAN-2026-7Y41C</p>
    </div>
  </div>
);

// --- Types & Interfaces ---
interface FormData {
  // Personal Info
  fullName: string;
  fatherName: string;
  dob: string;
  gender: string;
  email: string;
  mobile: string;
  aadhaar: string;
  otp: string;
  consent: boolean;
  
  // Address Details
  flatNumber: string;
  premisesName: string;
  roadStreet: string;
  areaLocality: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  
  // Office Address
  officeName: string;
  officeFlatNumber: string;
  officePremisesName: string;
  officeRoadStreet: string;
  officeAreaLocality: string;
  officeTownCity: string;
  officeState: string;
  officePincode: string;
  officeCountry: string;
  
  // Representative Details
  representativeTitle: string;
  representativeFirstName: string;
  representativeMiddleName: string;
  representativeLastName: string;
  representativeFlatNumber: string;
  representativePremisesName: string;
  representativeRoadStreet: string;
  representativeAreaLocality: string;
  representativeTownCity: string;
  representativeState: string;
  representativePincode: string;
  representativeCountry: string;
  capacity: string;
  verifierName: string;
  verificationPlace: string;
  
  // Source of Income
  sourceOfIncome: string[];
}

const initialData: FormData = {
  // Personal Info
  fullName: '',
  fatherName: '',
  dob: '',
  gender: '',
  email: '',
  mobile: '',
  aadhaar: '',
  otp: '',
  consent: false,
  
  // Address Details
  flatNumber: '',
  premisesName: '',
  roadStreet: '',
  areaLocality: '',
  district: '',
  state: '',
  pincode: '',
  country: 'INDIA',
  
  // Office Address
  officeName: '',
  officeFlatNumber: '',
  officePremisesName: '',
  officeRoadStreet: '',
  officeAreaLocality: '',
  officeTownCity: '',
  officeState: '',
  officePincode: '',
  officeCountry: 'INDIA',
  
  // Representative Details
  representativeTitle: '',
  representativeFirstName: '',
  representativeMiddleName: '',
  representativeLastName: '',
  representativeFlatNumber: '',
  representativePremisesName: '',
  representativeRoadStreet: '',
  representativeAreaLocality: '',
  representativeTownCity: '',
  representativeState: '',
  representativePincode: '',
  representativeCountry: 'INDIA',
  capacity: 'HIMSELF/HERSELF',
  verifierName: '',
  verificationPlace: '',
  
  // Source of Income
  sourceOfIncome: [],
};

// --- Main Component ---
export default function PanRegistrationForm({ user }: { user: any }) {
  const navigate = useNavigate();
  const { displayRazorpay } = useRazorpay();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState({
    identityProof: false,
    addressProof: false,
    dobProof: false,
    photo: false,
    signature: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [signatureUploaded, setSignatureUploaded] = useState<string | null>(null);


  const indianStates = [
    { value: 'ANDHRA_PRADESH', label: 'Andhra Pradesh' },
    { value: 'ARUNACHAL_PRADESH', label: 'Arunachal Pradesh' },
    { value: 'ASSAM', label: 'Assam' },
    { value: 'BIHAR', label: 'Bihar' },
    { value: 'CHHATTISGARH', label: 'Chhattisgarh' },
    { value: 'GOA', label: 'Goa' },
    { value: 'GUJARAT', label: 'Gujarat' },
    { value: 'HARYANA', label: 'Haryana' },
    { value: 'HIMACHAL_PRADESH', label: 'Himachal Pradesh' },
    { value: 'JHARKHAND', label: 'Jharkhand' },
    { value: 'KARNATAKA', label: 'Karnataka' },
    { value: 'KERALA', label: 'Kerala' },
    { value: 'MADHYA_PRADESH', label: 'Madhya Pradesh' },
    { value: 'MAHARASHTRA', label: 'Maharashtra' },
    { value: 'MANIPUR', label: 'Manipur' },
    { value: 'MEGHALAYA', label: 'Meghalaya' },
    { value: 'MIZORAM', label: 'Mizoram' },
    { value: 'NAGALAND', label: 'Nagaland' },
    { value: 'ODISHA', label: 'Odisha' },
    { value: 'PUNJAB', label: 'Punjab' },
    { value: 'RAJASTHAN', label: 'Rajasthan' },
    { value: 'SIKKIM', label: 'Sikkim' },
    { value: 'TAMIL_NADU', label: 'Tamil Nadu' },
    { value: 'TELANGANA', label: 'Telangana' },
    { value: 'TRIPURA', label: 'Tripura' },
    { value: 'UTTAR_PRADESH', label: 'Uttar Pradesh' },
    { value: 'UTTARAKHAND', label: 'Uttarakhand' },
    { value: 'WEST_BENGAL', label: 'West Bengal' },
    { value: 'DELHI', label: 'Delhi' },
  ];

  const validateField = (name: keyof FormData, value: any): string => {
    switch (name) {
      case 'fullName':
      case 'fatherName':
        return validators.name(value as string) === true ? '' : (validators.name(value as string) as string);
      case 'dob':
        return validators.dob(value as string) === true ? '' : (validators.dob(value as string) as string);
      case 'email':
        return validators.email(value as string) === true ? '' : (validators.email(value as string) as string);
      case 'mobile':
        return validators.mobile(value as string) === true ? '' : (validators.mobile(value as string) as string);
      case 'aadhaar':
        if ((value as string).trim() === '') return '';
        return validators.aadhaar(value as string) === true ? '' : (validators.aadhaar(value as string) as string);
      case 'otp':
        if (!otpSent) return '';
        return validators.otp(value as string) === true ? '' : (validators.otp(value as string) as string);
      case 'consent':
        return (value as boolean) ? '' : "You must agree to proceed";
      case 'pincode':
      case 'officePincode':
      case 'representativePincode':
        return validators.pincode(value as string) === true ? '' : (validators.pincode(value as string) as string);
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const key = name as keyof FormData;
    let formattedValue: any = value;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'sourceOfIncome') {
        const currentSources = formData.sourceOfIncome || [];
        formattedValue = checked 
          ? [...currentSources, value]
          : currentSources.filter(s => s !== value);
      } else {
        formattedValue = checked;
      }
    }

    if (['mobile'].includes(key)) formattedValue = (value as string).replace(/\D/g, '').slice(0, 10);
    if (key === 'aadhaar') formattedValue = (value as string).replace(/\D/g, '').slice(0, 12);
    if (key === 'otp') formattedValue = (value as string).replace(/\D/g, '').slice(0, 6);
    if (['pincode', 'officePincode', 'representativePincode'].includes(key)) {
      formattedValue = (value as string).replace(/\D/g, '').slice(0, 6);
    }

    setFormData((prev) => ({ ...prev, [key]: formattedValue }));
    if (touched[key]) {
      setErrors((prev) => ({ ...prev, [key]: validateField(key, formattedValue) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const key = name as keyof FormData;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, finalValue) }));
  };

  const getStepFields = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 1: return ['fullName', 'fatherName', 'dob', 'gender'];
      case 2: return ['email', 'mobile', 'aadhaar'];
      case 3: return ['otp', 'consent'];
      case 4: return ['flatNumber', 'premisesName', 'roadStreet', 'areaLocality', 'district', 'state', 'pincode'];
      case 5: return ['representativeFirstName', 'representativeLastName'];
      default: return [];
    }
  };

  const validateCurrentStep = (): boolean => {
    const fields = getStepFields(currentStep);
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;
    fields.forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    if (!isValid) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      setTouched((prev) => {
        const touchedFields = { ...prev };
        fields.forEach((f) => (touchedFields[f] = true));
        return touchedFields;
      });
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 2 && !otpSent) {
        alert(`OTP sent to +91 ${formData.mobile} (mock)`);
        setOtpSent(true);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => prev - 1);
  };

  const handleFileUpload = (key: keyof typeof uploadedDocs) => (file: File | null) => {
    setUploadedDocs((prev) => ({ ...prev, [key]: !!file }));
  };

  const handleProceedToPayment = async () => {
    const allUploaded = uploadedDocs.identityProof && uploadedDocs.addressProof && uploadedDocs.dobProof && uploadedDocs.photo && uploadedDocs.signature;
    if (!allUploaded) {
      alert('Please upload all required documents:\n• Identity Proof\n• Address Proof\n• DOB Proof\n• Photo\n• Signature');
      return;
    }
    if (!signatureUploaded) {
        alert('Please add your digital signature.');
        return;
    }

    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      await displayRazorpay(199, async (response) => {
        const docId = `DOC-${Date.now()}`;
        await mockDbService.createDocument({
          id: docId,
          type: 'pan',
          title: 'PAN Card Registration',
          serviceId: generateServiceId('PAN'),
          status: 'paid',
          submittedAt: Date.now(),
          formData: {
            ...formData,
            uploadedDocs: Object.keys(uploadedDocs).filter(k => uploadedDocs[k as keyof typeof uploadedDocs]),
            paymentId: response.razorpay_payment_id,
          },
          userId: user.uid,
          folderId: user.folderId,
        });
        setIsSubmitting(false);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      console.error('Payment failed:', err);
      setIsSubmitting(false);
      alert('Payment failed. Please try again.');
    }
  };

  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Application Preview</h3>
          <button onClick={() => setShowPreview(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Personal Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Full Name:</span> <span className="text-white">{formData.fullName || '—'}</span></div>
              <div><span className="text-slate-500">Father's Name:</span> <span className="text-white">{formData.fatherName || '—'}</span></div>
              <div><span className="text-slate-500">DOB:</span> <span className="text-white">{formData.dob || '—'}</span></div>
              <div><span className="text-slate-500">Gender:</span> <span className="text-white">{formData.gender || '—'}</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Contact Info</h4>
            <div className="text-sm">
              <div><span className="text-slate-500">Email:</span> <span className="text-white">{formData.email || '—'}</span></div>
              <div><span className="text-slate-500">Mobile:</span> <span className="text-white">{formData.mobile || '—'}</span></div>
              <div><span className="text-slate-500">Aadhaar:</span> <span className="text-white">{formData.aadhaar || 'Not provided'}</span></div>
            </div>
          </div>
          <div>
                <h4 className="font-semibold text-emerald-400 mb-2">Digital Signature</h4>
                <p className="text-slate-300">
                    {signatureUploaded ? '✅ Added' : '❌ Missing'}
                </p>
                </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Address</h4>
            <div className="text-sm text-white">
              <p>{formData.flatNumber}, {formData.premisesName}</p>
              <p>{formData.roadStreet}, {formData.areaLocality}</p>
              <p>{formData.district}, {formData.state} - {formData.pincode}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Documents Uploaded</h4>
            <ul className="space-y-2">
              {[
                { key: 'identityProof', label: 'Identity Proof' },
                { key: 'addressProof', label: 'Address Proof' },
                { key: 'dobProof', label: 'DOB Proof' },
                { key: 'photo', label: 'Photo' },
                { key: 'signature', label: 'Signature' },
              ].map((doc) => (
                <li key={doc.key} className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">{doc.label}</span>
                  {uploadedDocs[doc.key as keyof typeof uploadedDocs] ? (
                    <span className="text-emerald-400 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready
                    </span>
                  ) : (
                    <span className="text-slate-500">Pending</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 flex justify-end gap-3">
          <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:bg-slate-700">Close</button>
          <button
            onClick={handleProceedToPayment}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              isSubmitting ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Pay ₹199'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700/50">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">PAN Application Submitted!</h2>
          <p className="text-slate-300 mb-8">
            Your application has been received. Your case ID is{' '}
            <span className="text-sky-400 font-mono">PAN-2026-7Y41C</span>.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 border border-slate-600"
          >
            Apply for Another Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] to-[#0a192f] p-4 sm:p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="lg:hidden mb-6 text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">PAN Card Registration</h1>
          <p className="text-sky-200/80 text-sm">Step {currentStep} of 7</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <main className="lg:col-span-7 xl:col-span-8 glass-panel rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden relative min-h-[600px] flex flex-col">
            <div className="p-6 md:p-10 flex-grow">
              <div className="text-center mb-8 hidden lg:block">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">PAN Card Registration</h1>
                <p className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed">
                  {currentStep === 1 && 'Enter your personal and family details.'}
                  {currentStep === 2 && 'Provide contact information and Aadhaar.'}
                  {currentStep === 3 && 'Verify your mobile number and give consent.'}
                  {currentStep === 4 && 'Enter your residential address details.'}
                  {currentStep === 5 && 'Provide office address (if applicable).'}
                  {currentStep === 6 && 'Enter representative details and verification.'}
                  {currentStep === 7 && 'Upload required documents.'}
                </p>
              </div>
              <StatusBanner />
              <form noValidate>
                <div className="grid grid-cols-1 gap-y-10">
                  {currentStep === 1 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Personal Information
                      </legend>
                      <FormInput
                        label="Full Name (as per ID)"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fullName}
                        placeholder="e.g., Rajesh Kumar"
                        required
                        autoFocus
                      />
                      <FormInput
                        label="Father's Name"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fatherName}
                        placeholder="e.g., Suresh Kumar"
                        required
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="mb-5">
                          <label htmlFor="dob" className="block text-sm font-medium text-slate-200 mb-2">
                            Date of Birth <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="dob"
                            name="dob"
                            type="date"
                            value={formData.dob ? formData.dob.split('/').reverse().join('-') : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [year, month, day] = e.target.value.split('-');
                                const formattedDate = `${day}/${month}/${year}`;
                                setFormData((prev) => ({ ...prev, dob: formattedDate }));
                              } else {
                                setFormData((prev) => ({ ...prev, dob: '' }));
                              }
                              if (touched.dob) {
                                setErrors((prev) => ({ ...prev, dob: validateField('dob', formData.dob) }));
                              }
                            }}
                            onBlur={handleBlur}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 placeholder-slate-500 focus:ring-2 focus:outline-none appearance-none ${
                              errors.dob
                                ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
                                : "border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600"
                            }`}
                            required
                            style={{ colorScheme: 'dark' }}
                          />
                          {errors.dob ? (
                            <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {errors.dob}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-xs text-slate-500 font-mono">Format: DD/MM/YYYY</p>
                          )}
                        </div>

                        <div className="mb-5">
                          <label className="block text-sm font-medium text-slate-200 mb-1.5">
                            Gender <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-4 pt-1">
                            {(['Male', 'Female', 'Other'] as const).map((g) => (
                              <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="gender"
                                  value={g}
                                  checked={formData.gender === g}
                                  onChange={handleChange}
                                  className="w-4 h-4 text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500 focus:ring-2"
                                />
                                <span className="text-slate-300">{g}</span>
                              </label>
                            ))}
                          </div>
                          {errors.gender && <p className="mt-1.5 text-xs text-red-400">{errors.gender}</p>}
                        </div>
                      </div>
                    </fieldset>
                  )}

                  {currentStep === 2 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Contact & Identity
                      </legend>
                      <FormInput
                        type="email"
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        placeholder="you@example.com"
                        required
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
                      />
                      <FormInput
                        label="Aadhaar Number"
                        name="aadhaar"
                        value={formData.aadhaar}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.aadhaar}
                        placeholder="123456789012"
                        maxLength={12}
                        required
                      />
                    </fieldset>
                  )}

                  {currentStep === 3 && (
                    <fieldset className="space-y-6">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Verification & Consent
                      </legend>
                      {!otpSent ? (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
                          <p className="text-slate-300 mb-4">
                            We'll send a 6-digit OTP to <span className="font-mono text-sky-400">+91 {formData.mobile}</span>
                          </p>
                          <Button
                            type="button"
                            onClick={handleNext}
                            className="w-full bg-sky-500 hover:bg-sky-600"
                          >
                            Send OTP
                          </Button>
                        </div>
                      ) : (
                        <>
                          <FormInput
                            label="Enter OTP"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.otp}
                            placeholder="123456"
                            maxLength={6}
                            required
                          />
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="consent"
                              name="consent"
                              checked={formData.consent}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className="mt-1 w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor="consent" className="text-sm text-slate-300">
                              I authorize RegiBIZ to submit my PAN application on my behalf to the Income Tax Department.
                              {errors.consent && <span className="text-red-400 block mt-1">{errors.consent}</span>}
                            </label>
                          </div>
                        </>
                      )}
                    </fieldset>
                  )}

                  {currentStep === 4 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Address Details
                      </legend>
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 mb-4">
                        <p className="text-sm text-emerald-300">
                          <span className="font-semibold">Resident State:</span> Details will be captured based on Aadhaar Details
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                          label="Flat/Door/Block Number"
                          name="flatNumber"
                          value={formData.flatNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.flatNumber}
                          placeholder="e.g., A-101"
                          required
                        />
                        <FormInput
                          label="Name of Premises/Building/Village"
                          name="premisesName"
                          value={formData.premisesName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.premisesName}
                          placeholder="e.g., Sunrise Apartments"
                          required
                        />
                        <FormInput
                          label="Road/Street/Lane/Post Office"
                          name="roadStreet"
                          value={formData.roadStreet}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.roadStreet}
                          placeholder="e.g., MG Road"
                          required
                        />
                        <FormInput
                          label="Area/Locality/Taluka/Sub-Division"
                          name="areaLocality"
                          value={formData.areaLocality}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.areaLocality}
                          placeholder="e.g., Andheri West"
                          required
                        />
                        <FormInput
                          label="Town/City/District"
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.district}
                          placeholder="e.g., Mumbai"
                          required
                        />
                        <SelectInput
                          label="Select Residential State"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.state}
                          options={indianStates}
                          required
                        />
                        <FormInput
                          label="Pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.pincode}
                          placeholder="400053"
                          maxLength={6}
                          required
                        />
                        <FormInput
                          label="Country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled
                          required
                        />
                      </div>
                    </fieldset>
                  )}

                  {currentStep === 5 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Office Address <span className="text-emerald-400 text-sm font-normal">(Not Required)</span>
                      </legend>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                          label="Office Name"
                          name="officeName"
                          value={formData.officeName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officeName}
                          placeholder="e.g., ABC Corporation"
                          optional
                        />
                        <FormInput
                          label="Flat/Door/Block Number"
                          name="officeFlatNumber"
                          value={formData.officeFlatNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officeFlatNumber}
                          placeholder="e.g., 5th Floor"
                          optional
                        />
                        <FormInput
                          label="Name of Premises/Building/Village"
                          name="officePremisesName"
                          value={formData.officePremisesName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officePremisesName}
                          placeholder="e.g., Tech Park"
                          optional
                        />
                        <FormInput
                          label="Road/Street/Lane/Post Office"
                          name="officeRoadStreet"
                          value={formData.officeRoadStreet}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officeRoadStreet}
                          placeholder="e.g., Outer Ring Road"
                          optional
                        />
                        <FormInput
                          label="Area/Locality/Taluka/Sub-Division"
                          name="officeAreaLocality"
                          value={formData.officeAreaLocality}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officeAreaLocality}
                          placeholder="e.g., Bellandur"
                          optional
                        />
                        <FormInput
                          label="Town/City/District"
                          name="officeTownCity"
                          value={formData.officeTownCity}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officeTownCity}
                          placeholder="e.g., Bangalore"
                          optional
                        />
                        <SelectInput
                          label="Select Office State"
                          name="officeState"
                          value={formData.officeState}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officeState}
                          options={indianStates}
                           
                        />
                        <FormInput
                          label="Pincode"
                          name="officePincode"
                          value={formData.officePincode}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.officePincode}
                          placeholder="560103"
                          maxLength={6}
                          optional
                        />
                      </div>
                    </fieldset>
                  )}

                  {currentStep === 6 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Other Details
                      </legend>
                      
                      <div className="bg-slate-800/30 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-sky-400 mb-4">Representative Assessee Address Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <SelectInput
                            label="Title"
                            name="representativeTitle"
                            value={formData.representativeTitle}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeTitle}
                            options={[
                              { value: 'SHRI', label: 'Shri' },
                              { value: 'SMT', label: 'Smt' },
                              { value: 'KUMARI', label: 'Kumari' },
                            ]}
                          />
                          <FormInput
                            label="Last Name/Surname"
                            name="representativeLastName"
                            value={formData.representativeLastName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeLastName}
                            placeholder="e.g., Sharma"
                          />
                          <FormInput
                            label="First Name"
                            name="representativeFirstName"
                            value={formData.representativeFirstName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeFirstName}
                            placeholder="e.g., Rajesh"
                          />
                          <FormInput
                            label="Middle Name"
                            name="representativeMiddleName"
                            value={formData.representativeMiddleName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeMiddleName}
                            placeholder="e.g., Kumar"
                            optional
                          />
                          <FormInput
                            label="Flat/Door/Block Number"
                            name="representativeFlatNumber"
                            value={formData.representativeFlatNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeFlatNumber}
                            placeholder="e.g., B-205"
                          />
                          <FormInput
                            label="Name of Premises/Building/Village"
                            name="representativePremisesName"
                            value={formData.representativePremisesName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativePremisesName}
                            placeholder="e.g., Green Valley"
                          />
                          <FormInput
                            label="Road/Street/Lane/Post Office"
                            name="representativeRoadStreet"
                            value={formData.representativeRoadStreet}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeRoadStreet}
                            placeholder="e.g., Park Street"
                          />
                          <FormInput
                            label="Area/Locality/Taluka/Sub-Division"
                            name="representativeAreaLocality"
                            value={formData.representativeAreaLocality}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeAreaLocality}
                            placeholder="e.g., Salt Lake"
                          />
                          <FormInput
                            label="Town/City/District"
                            name="representativeTownCity"
                            value={formData.representativeTownCity}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeTownCity}
                            placeholder="e.g., Kolkata"
                          />
                          <SelectInput
                            label="Select State"
                            name="representativeState"
                            value={formData.representativeState}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativeState}
                            options={indianStates}
                          />
                          <FormInput
                            label="Pincode"
                            name="representativePincode"
                            value={formData.representativePincode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.representativePincode}
                            placeholder="700091"
                            maxLength={6}
                          />
                          <SelectInput
                            label="Select Country"
                            name="representativeCountry"
                            value={formData.representativeCountry}
                            onChange={handleChange}
                            options={[{ value: 'INDIA', label: 'INDIA' }]}
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-sm font-semibold text-sky-400 mb-4">Declaration</h4>
                        <SelectInput
                          label="You do hereby declare that whatever stated above is true in the capacity of"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleChange}
                          options={[
                            { value: 'HIMSELF/HERSELF', label: 'Himself/Herself' },
                            { value: 'AUTHORISED_REPRESENTATIVE', label: 'Authorised Representative' },
                          ]}
                          required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FormInput
                            label="Verifier Name"
                            name="verifierName"
                            value={formData.verifierName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.verifierName}
                            placeholder="e.g., RAJESH KUMAR SHARMA"
                            required
                          />
                          <FormInput
                            label="Verification Place"
                            name="verificationPlace"
                            value={formData.verificationPlace}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.verificationPlace}
                            placeholder="e.g., MUMBAI"
                            required
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-700 pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-sky-400 mb-4">Source of Income</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {['Salary', 'Income from House Property', 'Capital Gains', 'Income from Other source', 'Business / Profession', 'No Income'].map((source) => (
                            <label key={source} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                name="sourceOfIncome"
                                value={source}
                                checked={(formData.sourceOfIncome || []).includes(source)}
                                onChange={handleChange}
                                className="w-4 h-4 text-emerald-500 bg-slate-800 border-slate-600 rounded focus:ring-emerald-500"
                              />
                              <span className="text-slate-300">{source}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </fieldset>
                  )}

                  {currentStep === 7 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                        Documents Upload
                      </legend>
                      <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg p-3 mb-4">
                        <p className="text-sm text-sky-300">
                          This facility is applicable only when PAN application process through Digital(DSC or eSign) mode
                        </p>
                      </div>
                      
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 mb-6">
                        <p className="text-sm text-emerald-300">
                          <span className="font-semibold">Resident State:</span> Details will be captured based on Aadhaar Details
                        </p>
                        <p className="text-xs text-red-400 mt-1">
                          (Uploaded pdf file should not be password protected otherwise Application will be rejected)
                        </p>
                      </div>

                      <FileUploader
                        label="Which of these documents are you submitting as an Identity Proof"
                        name="identityProof"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload('identityProof')}
                        required
                        hint="AADHAAR Card issued by UIDAI (In Copy) - PDF/JPEG/PNG (Max 2MB)"
                      />

                      <FileUploader
                        label="Which of these documents are you submitting as an Address Proof"
                        name="addressProof"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload('addressProof')}
                        required
                        hint="AADHAAR Card issued by UIDAI (In Copy) - PDF/JPEG/PNG (Max 2MB)"
                      />

                      <FileUploader
                        label="Which of these documents are you submitting as a DOB/DOI Proof"
                        name="dobProof"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload('dobProof')}
                        required
                        hint="AADHAAR Card issued by UIDAI (In Copy) - PDF/JPEG/PNG (Max 2MB)"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FileUploader
                          label="Applicant Photo File"
                          name="photo"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleFileUpload('photo')}
                          required
                          hint="Photo: 300 dpi, Color, 213 x 213 px (Size: less than 30 kb)"
                        />
                        <FileUploader
                          label="Applicant Signature File"
                          name="signature"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleFileUpload('signature')}
                          required
                          hint="Signature: 600 dpi, Black & White (Size: less than 60 kb)"
                        />
                      </div>
                      {/* Digital Signature */}
                            <div className="pt-4 border-t border-slate-700/30">
                                <h3 className="text-md font-medium text-slate-200 mb-2">Digital Signature</h3>
                                <SignatureQRSection
                                onSignatureChange={(url) => setSignatureUploaded(url)}
                                />
                            </div>

                      <div className="bg-slate-800/30 rounded-lg p-4 mt-6">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Scanning Specification</h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                          <li>• Photo Scanning 300 dpi, Colour, 213 X 213 px (Size: less than 30 kb)</li>
                          <li>• Signature scanning 600 dpi black and white (Size: less than 60 kb)</li>
                        </ul>
                      </div>
                    </fieldset>
                  )}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-700/50">
                  <div className="flex flex-col-reverse md:flex-row items-center gap-4 justify-between">
                    <div className="w-full md:w-auto flex gap-4">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePrevious}
                          className="w-full md:w-auto px-6 py-4 rounded-xl font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-all duration-200"
                        >
                          Back
                        </button>
                      )}
                    </div>
                    {currentStep < 7 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={currentStep === 3 && !otpSent}
                        className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all duration-300 ${
                          currentStep === 3 && !otpSent
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-sky-500 text-white hover:bg-sky-400 hover:-translate-y-1'
                        } flex items-center justify-center`}
                      >
                        {currentStep === 3 && !otpSent ? 'Send OTP' : 'Next Step'}
                        {currentStep !== 3 || otpSent ? (
                          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        ) : null}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        disabled={isSubmitting}
                        className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all duration-300 ${
                          isSubmitting
                            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-70'
                            : 'bg-emerald-500/90 text-white hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        }`}
                      >
                        {isSubmitting ? 'Processing...' : 'Pay ₹199'}
                      </button>
                    )}
                  </div>
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Step {currentStep} of 7 — By continuing, you agree to our{' '}
                    <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline">Terms</a>{' '}
                    and{' '}
                    <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline">Policy</a>.
                  </p>
                </div>
              </form>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-5 xl:col-span-4 sticky top-8 hidden lg:block">
            <div className="space-y-6">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
                <h3 className="text-white text-sm font-semibold mb-4">Progress Status</h3>
                <div className="relative border-l-2 border-slate-700/60 ml-2 space-y-6 my-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((step) => {
                    const isActive = step === currentStep;
                    const isCompleted = step < currentStep;
                    return (
                      <div key={step} className="ml-5 relative">
                        <span
                          className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-slate-800 ${
                            isCompleted
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : isActive
                                ? 'bg-sky-500 ring-4 ring-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-110'
                                : 'bg-slate-700'
                          }`}
                        ></span>
                        <h4 className={`text-xs font-medium ${isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {step === 1 ? 'Personal Details'
                            : step === 2 ? 'Contact & Aadhaar'
                              : step === 3 ? 'OTP & Consent'
                                : step === 4 ? 'Address Details'
                                  : step === 5 ? 'Office Address'
                                    : step === 6 ? 'Other Details'
                                      : 'Documents Upload'}
                        </h4>
                        {step === 7 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {Object.values(uploadedDocs).filter(Boolean).length}/5 Uploaded
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowPreview(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-600/50 text-sky-400 font-bold tracking-wide shadow-lg hover:bg-slate-700 hover:text-white transition-all duration-300"
                >
                  Preview Application
                </button>
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-12 text-center text-slate-500 text-sm pb-8">&copy; 2026 RegiBIZ. All rights reserved.</div>
      </div>
      {showPreview && <PreviewModal />}
    </div>
  );
}