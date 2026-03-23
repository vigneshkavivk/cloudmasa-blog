    // servicepanel/pan-registration.tsx
    import React from "react";
    import { CheckCircle, BadgeCheck, Phone, Mail, User } from "lucide-react";
    import { useNavigate } from "react-router-dom";

    export default function PanRegistrationLanding() {
    const navigate = useNavigate();

    const handleAvailService = () => {
        navigate("/services/pan-registration/form");
    };

    const handleRequestCallback = () => {
        window.open("https://wa.me/919876543210", "_blank"); // ✅ removed extra spaces
    };

    const benefits = [
        "Mandatory for filing income tax returns",
        "Required for opening bank accounts & financial transactions",
        "Acts as a valid photo ID across India",
        "Needed for high-value purchases (e.g., vehicles, property)",
    ];

    const documents = [
        { icon: BadgeCheck, label: "Proof of Identity (Aadhaar, Voter ID, Passport)" },
        { icon: User, label: "Recent Passport-sized Photograph" },
        { icon: Mail, label: "Active Email Address" },
        { icon: Phone, label: "Mobile Number Linked to Aadhaar (for e-KYC)" },
    ];

    const steps = [
        { step: 1, title: "Fill details", desc: "Enter personal info & upload docs" },
        { step: 2, title: "Verify & pay", desc: "Complete e-KYC or manual verification" },
        { step: 3, title: "Get PAN", desc: "Receive e-PAN via email in 2 days" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#020c1b] to-[#0a192f]">
        <header className="border-b border-white/10 bg-[#020c1b]/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-white">PAN Card Registration</h1>
                {/* Replaced Badge with inline span */}
                <span className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full">
                Essential
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-emerald-400">₹199</span>
                <span className="text-sm text-gray-500 line-through">₹399</span>
            </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Info */}
            <div className="space-y-6">
                {/* Card 1 */}
                <div className="glass-card border-l-4 border-emerald-500 p-5 rounded-xl">
                <h3 className="font-semibold text-lg mb-3 text-white">Why apply for PAN?</h3>
                <ul className="space-y-2">
                    {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{b}</span>
                    </li>
                    ))}
                </ul>
                </div>

                {/* Card 2 */}
                <div className="glass-card p-5 rounded-xl">
                <h3 className="font-semibold text-lg mb-3 text-white">What is PAN?</h3>
                <p className="text-gray-400 leading-relaxed">
                    Permanent Account Number (PAN) is a 10-digit alphanumeric identifier issued by the Income Tax Department.
                    It’s mandatory for all financial and tax-related activities in India.
                </p>
                </div>

                {/* Card 3 */}
                <div className="glass-card p-5 rounded-xl">
                <h3 className="font-semibold text-lg mb-3 text-white">Documents required</h3>
                <div className="space-y-3">
                    {documents.map((doc, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <doc.icon className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{doc.label}</span>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            {/* Right: CTA */}
            <div className="lg:col-span-2">
                <div className="glass-card h-full flex flex-col rounded-xl">
                <div className="flex-1 p-6 flex flex-col">
                    <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Get your PAN in 48 hours</h2>
                    <p className="text-gray-400">Digitally verified. No physical submission needed.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {steps.map((item, i) => (
                        <div key={i} className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="font-bold text-emerald-400">{item.step}</span>
                        </div>
                        <h3 className="font-medium text-sm text-white">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                    ))}
                    </div>

                    <div className="mt-auto space-y-4">
                    {/* Callback Button */}
                    <button
                        type="button"
                        onClick={handleRequestCallback}
                        className="w-full flex items-center justify-center gap-2 text-gray-300 border border-gray-700 hover:bg-gray-800 rounded-lg px-4 py-2.5 transition-colors"
                    >
                        <Phone className="w-4 h-4" /> Request a callback
                    </button>

                    {/* Apply Button */}
                    <button
                        type="button"
                        onClick={handleAvailService}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                        Apply for PAN Card
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </main>
        </div>
    );
    }

    function ArrowRight({ className }: { className?: string }) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        >
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
        </svg>
    );
    }