import React from "react";
import {
  CheckCircle,
  ShieldCheck,
  Tag,
  FileText,
  Search,
  Phone as PhoneIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function TrademarkLanding() {
  const navigate = useNavigate();

  const handleStartApplication = () => {
    navigate("/services/trademark-registration/form");
  };

  const handleRequestCallback = () => {
    window.open("https://wa.me/919876543210", "_blank");
  };

  const handleGoBack = () => {
    navigate("/services");
  };

  const benefits = [
    "Protect your brand name & logo legally across India",
    "Exclusive rights to use ® symbol after approval",
    "Prevent competitors from copying your identity",
    "Valid for 10 years & renewable lifetime"
  ];

  const documents = [
    { icon: FileText, label: "PAN Card (Individual/Company)" },
    { icon: ShieldCheck, label: "Aadhaar / Incorporation Certificate" },
    { icon: Tag, label: "Brand Name & Logo (Optional)" },
    { icon: Search, label: "Business Activity Description" }
  ];

  const steps = [
    { step: 1, title: "Submit brand details", desc: "Enter name, logo & applicant info" },
    { step: 2, title: "Class search & filing", desc: "We verify & file with IP India" },
    { step: 3, title: "Get TM acknowledgment", desc: "Receive application number instantly" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020c1b] to-[#0a192f]">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#020c1b]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Trademark Registration</h1>
            <Badge className="mt-1 bg-orange-500/10 text-orange-400">
              Popular
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-orange-400">₹4,999</span>
            <span className="text-sm text-gray-500 line-through">₹7,999</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* BACK BUTTON */}
        <button 
          onClick={handleGoBack}
          className="flex items-center text-white bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 border border-orange-500 rounded-lg px-4 py-2 mb-6 transition-all hover:from-orange-500 hover:via-red-500 hover:to-pink-500 shadow-lg"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SECTION */}
          <div className="space-y-6">
            <Card className="glass-card border-l-4 border-orange-500">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3 text-white">Why register trademark?</h3>
                <ul className="space-y-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3 text-white">Documents Required</h3>
                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <doc.icon className="w-5 h-5 text-orange-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{doc.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3 text-white">What happens after filing?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Once filed, your application is submitted with the 
                  <strong> IP India Office</strong>. You receive an acknowledgment number immediately. 
                  After examination & objection clearance, your trademark will be published and registered.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SECTION */}
          <div className="lg:col-span-2">
            <Card className="glass-card h-full flex flex-col">
              <CardContent className="flex-1 p-6 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Simple 3 Step Process</h2>
                  <p className="text-gray-400">Fast, secure & legally compliant filing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {steps.map((item, i) => (
                    <div key={i} className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="font-bold text-orange-400">{item.step}</span>
                      </div>
                      <h3 className="font-medium text-sm text-white">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-4">
                  <Button
                    className="w-full flex items-center justify-center gap-2 text-gray-300 border border-gray-700 hover:bg-gray-800"
                    onClick={handleRequestCallback}
                  >
                    <PhoneIcon className="w-4 h-4" /> Request Call Back
                  </Button>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-500 hover:via-red-500 hover:to-pink-500 flex items-center justify-center gap-2 text-white shadow-lg"
                    onClick={handleStartApplication}
                  >
                    Start Trademark Registration
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