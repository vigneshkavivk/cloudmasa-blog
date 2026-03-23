// src/pages/services/StartupIndiaRegistrationLanding.tsx
import React from "react";
import { CheckCircle, Building, Phone as PhoneIcon, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function StartupIndiaRegistrationLanding() {
  const navigate = useNavigate();

  const handleAvailService = () => {
    navigate("/services/startup-india/form");
  };

  const handleRequestCallback = () => {
    window.open("https://wa.me/919876543210", "_blank");
  };

  const handleGoBack = () => {
    navigate("/services");
  };

  const benefits = [
    "Get DPIIT recognition & tax exemption for 3 years",
    "Access ₹50+ Lakh government grants & funding schemes",
    "Fast-track patent filing with 80% fee rebate",
    "Eligible for public procurement tenders reserved for startups",
  ];

  const documents = [
    { icon: Building, label: "Certificate of Incorporation (Company/LLP)" },
    { icon: FileText, label: "Brief write-up on innovation (≤500 words)" },
    { icon: Building, label: "PAN Card of the Entity" },
    { icon: PhoneIcon, label: "Active Mobile & Email ID" },
  ];

  const steps = [
    { step: 1, title: "Describe your startup", desc: "Explain your innovative product/service" },
    { step: 2, title: "We file with DPIIT", desc: "Our experts submit & track your application" },
    { step: 3, title: "Get Recognition", desc: "Receive DPIIT certificate via email" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020c1b] to-[#0a192f]">
      <header className="border-b border-white/10 bg-[#020c1b]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Startup India Registration</h1>
            <Badge variant="secondary" className="mt-1 bg-emerald-500/10 text-emerald-400">
              DPIIT Recognized
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-emerald-400">Free</span>
            <span className="text-sm text-gray-500 line-through">₹1,499</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
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
                <h3 className="font-semibold text-lg mb-3 text-white">Why register?</h3>
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
                  Startup India registration gives your venture official DPIIT recognition,
                  unlocking tax holidays, easier compliance, and investor credibility.
                  With <strong>RegiBIZ</strong>, we help you draft your innovation summary and file instantly — zero fees, full support.
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
                  <h2 className="text-xl font-bold text-white mb-2">Get DPIIT recognized in 3 steps</h2>
                  <p className="text-gray-400">We handle everything — from innovation summary to final certificate.</p>
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
                    className="w-full flex items-center justify-center gap-2 text-gray-300 border border-gray-700 hover:bg-gray-800"
                    onClick={handleRequestCallback}
                  >
                    <PhoneIcon className="w-4 h-4" /> Request Callback
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 flex items-center justify-center gap-2 text-white shadow-lg"
                    onClick={handleAvailService}
                  >
                    Start Registration
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