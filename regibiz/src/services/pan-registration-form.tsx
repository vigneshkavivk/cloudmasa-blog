    // services/pan-registration-form.tsx
    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useRazorpay } from '../hooks/useRazorpay';
    import { mockDbService } from '../services/mockFirebase';
    import { generateServiceId } from '../utils/helpers';
    // Add this with other imports
    import SignatureQRSection from '../components/SignatureFlow/SignatureQRSection';

    const validators = {
    required: (value: string) => value.trim().length > 0 || "This field is required",
    name: (value: string) => /^[A-Za-z\s]{2,50}$/.test(value) || "Enter a valid name (letters and spaces only)",
    dob: (value: string) => {
        if (!value) return "Date of birth is required";
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return (age >= 18 && age <= 100) || "Applicant must be 18+ years old";
    },
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
    mobile: (value: string) => /^[6-9]\d{9}$/.test(value) || "Enter a valid 10-digit mobile number",
    aadhaar: (value: string) => /^\d{12}$/.test(value) || "Aadhaar must be 12 digits",
    otp: (value: string) => /^\d{6}$/.test(value) || "Enter a 6-digit OTP",
    };

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

    const FileUploader: React.FC<{
    label: string;
    name: string;
    accept?: string;
    onChange: (file: File | null) => void;
    required?: boolean;
    }> = ({ label, name, accept = ".jpg,.jpeg,.png", onChange, required }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFileName(file?.name || null);
        onChange(file);
    };

    return (
        <div className="mb-5">
        <div className="flex justify-between items-baseline mb-1.5">
            <label className="block text-sm font-medium text-slate-200">
            {label} {required && <span className="text-red-500">*</span>}
            </label>
        </div>
        <div
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer group ${
            fileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
            }`}
            onClick={() => fileInputRef.current?.click()}
        >
            <input type="file" ref={fileInputRef} name={name} accept={accept} className="hidden" onChange={handleFileChange} />
            <div className="flex items-center space-x-4">
            <div className={`p-2.5 rounded-lg shrink-0 ${fileName ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
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
                    <p className="text-sm text-slate-300 font-medium">Click to upload photo</p>
                    <p className="text-xs text-slate-500 mt-0.5">JPEG/PNG (Max 200KB)</p>
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
                className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg"
                >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
            </div>
        </div>
        </div>
    );
    };

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

    interface FormData {
    fullName: string;
    fatherName: string;
    dob: string;
    gender: string;
    email: string;
    mobile: string;
    aadhaar: string; // ✅ Added
    otp: string;     // ✅ Added
    consent: boolean; // ✅ Added
    }

    const initialData: FormData = {
    fullName: '',
    fatherName: '',
    dob: '',
    gender: '',
    email: '',
    mobile: '',
    aadhaar: '',
    otp: '',
    consent: false,
    };

    export default function PanRegistrationForm({ user }: { user: any }) {
    const navigate = useNavigate();
    const { displayRazorpay } = useRazorpay();
    const [formData, setFormData] = useState<FormData>(initialData);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [currentStep, setCurrentStep] = useState(1);
    const [photoUploaded, setPhotoUploaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [otpSent, setOtpSent] = useState(false); // ✅ Track OTP state
    const [signatureUploaded, setSignatureUploaded] = useState<string | null>(null);

    const validateField = (name: keyof FormData, value: string | boolean): string => {
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
        default:
            return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const key = name as keyof FormData;
        let formattedValue: string | boolean = type === 'checkbox' ? checked : value;

        if (['mobile'].includes(key)) formattedValue = (value as string).replace(/\D/g, '').slice(0, 10);
        if (key === 'aadhaar') formattedValue = (value as string).replace(/\D/g, '').slice(0, 12);
        if (key === 'otp') formattedValue = (value as string).replace(/\D/g, '').slice(0, 6);

        setFormData((prev) => ({ ...prev, [key]: formattedValue }));
        if (touched[key]) {
        setErrors((prev) => ({ ...prev, [key]: validateField(key, formattedValue) }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const key = name as keyof FormData;
        const finalValue = type === 'checkbox' ? checked : value;
        setTouched((prev) => ({ ...prev, [key]: true }));
        setErrors((prev) => ({ ...prev, [key]: validateField(key, finalValue) }));
    };

    const getStepFields = (step: number): (keyof FormData)[] => {
        switch (step) {
            case 1: return ['fullName', 'fatherName', 'dob', 'gender'];
            case 2: return ['email', 'mobile', 'aadhaar'];
            case 3: return ['otp', 'consent'];
            case 4: return []; // Photo handled separately
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
            // Block Step 4 → 5 if no photo
            if (currentStep === 4 && !photoUploaded) {
            alert("Please upload your photograph first.");
            return;
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentStep((prev) => prev + 1);
        }
        };

    const handlePrevious = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentStep((prev) => prev - 1);
    };

    const handleProceedToPayment = async () => {
    if (!photoUploaded) {
        alert('Please upload your photograph.');
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
            photoUploaded,
            signatureUploaded, // 👈 Save it
            paymentId: response.razorpay_payment_id,
            },
            userId: user.uid,
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
                <h4 className="font-semibold text-emerald-400 mb-2">Verification</h4>
                <p className="text-slate-300">{otpSent ? '✅ OTP Verified' : '❌ Not verified'}</p>
                <p className="text-slate-300 mt-1">{formData.consent ? '✅ Consent given' : '❌ Consent not given'}</p>
            </div>
            <div>
                <h4 className="font-semibold text-emerald-400 mb-2">Photograph</h4>
                <p className="text-slate-300">{photoUploaded ? '✅ Uploaded' : '❌ Missing'}</p>
            </div>
            <div>
                <h4 className="font-semibold text-emerald-400 mb-2">Digital Signature</h4>
                <p className="text-slate-300">
                    {signatureUploaded ? '✅ Added' : '❌ Missing'}
                </p>
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
            <p className="text-sky-200/80 text-sm">Step {currentStep} of 4</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <main className="lg:col-span-7 xl:col-span-8 glass-panel rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden relative min-h-[600px] flex flex-col">
                <div className="p-6 md:p-10 flex-grow">
                <div className="text-center mb-8 hidden lg:block">
                    <h1 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">PAN Card Registration</h1>
                    <p className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed">
                    {currentStep === 1 && 'Enter your personal and family details.'}
                    {currentStep === 2 && 'Provide contact information and Aadhaar (optional).'}
                    {currentStep === 3 && 'Verify your mobile number and give consent.'}
                    {currentStep === 4 && 'Upload your photograph for identity proof.'}
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
                            <FormInput
                            type="date"
                            label="Date of Birth"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.dob}
                            required
                            />
                            <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-200 mb-1.5">Gender</label>
                            <div className="flex gap-4">
                                {(['Male', 'Female', 'Other'] as const).map((g) => (
                                <label key={g} className="flex items-center gap-2 text-sm">
                                    <input
                                    type="radio"
                                    name="gender"
                                    value={g}
                                    checked={formData.gender === g}
                                    onChange={handleChange}
                                    className="text-emerald-500 focus:ring-emerald-500"
                                    />
                                    {g}
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
                            optional
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
                                We’ll send a 6-digit OTP to <span className="font-mono text-sky-400">+91 {formData.mobile}</span>
                            </p>
                            <button
                                type="button"
                                onClick={handleNext}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
                                >
                                Send OTP
                                </button>
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
                        <div>
                            <fieldset className="space-y-6">
                            <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6">
                                Identity Verification
                            </legend>

                            {/* Photo Upload */}
                            <div>
                                <h3 className="text-md font-medium text-slate-200 mb-2">Passport-sized Photograph</h3>
                                <FileUploader
                                label="Upload Photo (White Background)"
                                name="photo"
                                required
                                onChange={(file) => setPhotoUploaded(!!file)}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                Format: JPEG/PNG • Size: &lt;200KB • Recent, clear, front-facing
                                </p>
                            </div>

                            {/* Digital Signature */}
                            <div className="pt-4 border-t border-slate-700/30">
                                <h3 className="text-md font-medium text-slate-200 mb-2">Digital Signature</h3>
                                <SignatureQRSection
                                onSignatureChange={(url) => setSignatureUploaded(url)}
                                />
                            </div>
                            </fieldset>
                        </div>
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
                        {/* Replace your current button logic with this */}
                    {currentStep < 4 ? (
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
                        Step {currentStep} of 4 — By continuing, you agree to our{' '}
                        <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline">Terms</a>{' '}
                        and{' '}
                        <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline">Policy</a>.
                    </p>
                    </div>
                </form>
                </div>
            </main>
            <aside className="lg:col-span-5 xl:col-span-4 sticky top-8">
                <div className="space-y-6 hidden lg:block">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
                    <h3 className="text-white text-sm font-semibold mb-4">Progress Status</h3>
                    <div className="relative border-l-2 border-slate-700/60 ml-2 space-y-6 my-2">
                    {[1, 2, 3, 4].map((step) => {
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
                            : 'Photo & Signature'}
                            </h4>
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