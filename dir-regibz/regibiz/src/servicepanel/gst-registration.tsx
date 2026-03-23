// \src\servicepanel\gst-registration.tsx
import React from "react";
import { CheckCircle, Building, Phone, Banknote, Phone as PhoneIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function GstRegistrationLanding() {
  const navigate = useNavigate();

  const handleAvailService = () => {
    navigate("/services/gst-registration/form");
  };

  const handleRequestCallback = () => {
    window.open("https://wa.me/919876543210", "_blank");
  };

  // ✅ Back button functionality
  const handleGoBack = () => {
    navigate("/services");
  };

  const benefits = [
    "Become legally compliant and avoid penalties",
    "Open a current account easily with GSTIN",
    "Claim input tax credit on purchases",
    "Required for B2B invoicing & e-commerce platforms",
  ];

  const documents = [
    { icon: CheckCircle, label: "PAN Card (Business/Proprietor)" },
    { icon: Building, label: "Proof of Business Address" },
    { icon: Phone, label: "Active Mobile & Email" },
    { icon: Banknote, label: "Bank Account Details (for GST registration)" },
  ];

  const steps = [
    { step: 1, title: "Share details", desc: "Fill basic info & upload docs" },
    { step: 2, title: "We verify & file", desc: "Our experts validate & submit" },
    { step: 3, title: "Receive GSTIN", desc: "Get your certificate via email" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020c1b] to-[#0a192f]">
      <header className="border-b border-white/10 bg-[#020c1b]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">GST Registration</h1>
            <Badge variant="secondary" className="mt-1 bg-emerald-500/10 text-emerald-400">
              Popular
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-emerald-400">₹499</span>
            <span className="text-sm text-gray-500 line-through">₹999</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ✅ BACK BUTTON WITH NEW GRADIENT */}
        <button 
          onClick={handleGoBack}
          className="flex items-center text-white hover:text-white bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 border border-teal-600 rounded-lg px-4 py-2 mb-6 transition-colors hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 shadow-lg"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="space-y-6">
            <Card className="glass-card border-l-4 border-emerald-500">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3 text-white">Why choose this?</h3>
                <ul className="space-y-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3 text-white">What is this service?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Every business selling goods or services must register for GST if turnover exceeds ₹40 lakhs
                  (₹20 lakhs for services in most states). With RegiBIZ, get your GSTIN in 3–5 working days —
                  hassle-free, with expert support.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3 text-white">Documents you'll need</h3>
                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <doc.icon className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{doc.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: CTA */}
          <div className="lg:col-span-2">
            <Card className="glass-card h-full flex flex-col">
              <CardContent className="flex-1 p-6 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Get started in 3 simple steps</h2>
                  <p className="text-gray-400">We handle the paperwork — you focus on your business.</p>
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
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-gray-300 border-gray-700 hover:bg-gray-800"
                    onClick={handleRequestCallback}
                  >
                    <PhoneIcon className="w-4 h-4" /> Call Back
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 flex items-center justify-center gap-2 text-white shadow-lg"
                    onClick={handleAvailService}
                  >
                    Subscription
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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