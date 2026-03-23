    // src/pages/GstComplianceGuide.tsx
    import React from "react";
    import { useNavigate } from "react-router-dom";
    import { Card, CardContent } from "../components/ui/card";
    import { Badge } from "../components/ui/badge";
    import { Button } from "../components/ui/button";

    const complianceIssues = [
    {
        id: 1,
        title: "Return Filing Reminder",
        severity: "high",
        problem: "GSTR-1, GSTR-3B time-ku file panna marandhaa / Nil return kooda file panna marandhaa",
        result: "Late fee ₹50/day • Interest 18% • 6 months miss aana GST cancel",
        solution: ["Monthly reminder set pannu (10th, 20th)", "Sales illa na 'Nil Return' file pannu", "Simple accounting software use pannu"],
        icon: "📅",
        color: "amber"
    },
    {
        id: 2,
        title: "GSTR-1 vs 3B Mismatch",
        severity: "critical",
        problem: "Invoice details GSTR-1-la one amount, Tax payment GSTR-3B-la vera amount",
        result: "System mismatch notice • ITC block • Department clarification",
        solution: ["File panna munnaadi reconciliation pannu", "Sales register verify pannu", "Excel reconciliation maintain pannu"],
        icon: "⚖️",
        color: "red"
    },
    {
        id: 3,
        title: "Input Tax Credit (ITC) Block",
        severity: "critical",
        problem: "Supplier GST return file panna illa / Fake invoice use panninaa",
        result: "ITC reject • Extra tax pay panna solluvaanga • Penalty + interest",
        solution: ["Only active GST suppliers kitta purchase pannu", "GSTIN verify pannu portal-la", "GSTR-2B check panni apram ITC claim pannu"],
        icon: "🔒",
        color: "red"
    },
    {
        id: 4,
        title: "Wrong HSN Code Use",
        severity: "medium",
        problem: "Wrong tax rate apply panninaa",
        result: "Short payment notice • Extra tax + penalty",
        solution: ["HSN code correct-aa confirm pannu", "Doubt irundhaa CA consult pannu"],
        icon: "🏷️",
        color: "orange"
    },
    {
        id: 5,
        title: "GST Payment Delay",
        severity: "high",
        problem: "Tax collect pannitu pay panna delay panninaa",
        result: "18% interest • Demand notice",
        solution: ["GST amount separate bank account-la maintain pannu", "Monthly profit-la mix panna koodaadhu"],
        icon: "💰",
        color: "amber"
    },
    {
        id: 6,
        title: "Address/Business Change Update Pannala",
        severity: "medium",
        problem: "Business location change pannitu update panna marandhaa",
        result: "Inspection problem • GST suspend panniduvaanga",
        solution: ["15 days kulla amendment apply pannu"],
        icon: "📍",
        color: "orange"
    },
    {
        id: 7,
        title: "E-Invoice / E-Way Bill Issue",
        severity: "high",
        problem: "Turnover limit exceed aana rules follow panna vendiyadhu",
        result: "₹10,000 per invoice fine • Goods detention",
        solution: ["Turnover monitor pannu", "E-way bill generate pannu before transport"],
        icon: "🚚",
        color: "amber"
    },
    ];

    export default function GstComplianceGuide() {
    const navigate = useNavigate();

    const getSeverityBadge = (severity: string) => {
        const variants: Record<string, string> = {
        critical: "bg-red-500/20 text-red-400 border-red-500/30",
        high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        };
        return variants[severity] || "bg-slate-500/20 text-slate-400";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#020c1b] to-[#0a192f]">
        {/* Header */}
        <header className="border-b border-white/10 bg-[#020c1b]/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-white">GST Compliance Guide</h1>
                <Badge variant="secondary" className="mt-1 bg-sky-500/10 text-sky-400">
                Post-Registration
                </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="border-slate-600 text-slate-300">
                ← Back
            </Button>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-sky-900/30 to-cyan-900/20 border border-sky-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-300">
                💡 <strong>Pro Tip:</strong> GST registration mudinchaalum, compliance maintain panna dhaan mukkiyam! 
                Indha 7 common mistakes-ah avoid panni, penalties-la irundhu save aagalam.
            </p>
            </div>

            {/* Compliance Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceIssues.map((issue) => (
                <Card key={issue.id} className="glass-card border-l-4 border-l-amber-500 hover:border-l-amber-400 transition-all">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{issue.icon}</span>
                        <h3 className="font-semibold text-white text-sm">{issue.title}</h3>
                    </div>
                    <Badge className={getSeverityBadge(issue.severity)} variant="outline">
                        {issue.severity.toUpperCase()}
                    </Badge>
                    </div>

                    {/* Problem */}
                    <div className="mb-3">
                    <p className="text-xs font-medium text-red-400 mb-1">❌ Problem:</p>
                    <p className="text-xs text-slate-300">{issue.problem}</p>
                    </div>

                    {/* Result */}
                    <div className="mb-3">
                    <p className="text-xs font-medium text-amber-400 mb-1">⚠️ Result:</p>
                    <p className="text-xs text-slate-400">{issue.result}</p>
                    </div>

                    {/* Solution Accordion */}
                    <details className="group">
                    <summary className="text-xs text-sky-400 cursor-pointer hover:text-sky-300 flex items-center gap-1 list-none">
                        <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        How to avoid?
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-slate-300 pl-4 border-l-2 border-slate-700">
                        {issue.solution.map((sol, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            {sol}
                        </li>
                        ))}
                    </ul>
                    </details>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full text-xs border-slate-600 text-slate-300 hover:bg-slate-800"
                        onClick={() => window.open("https://wa.me/919876543210?text=Help with: " + issue.title, "_blank")}
                    >
                        Get Help on This →
                    </Button>
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>

            {/* CTA Section */}
            <div className="mt-8 text-center">
            <Card className="glass-card border-emerald-500/30">
                <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-2">Need Expert Help?</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Our CA partners can help you with monthly filing, reconciliation & compliance.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                    className="bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800"
                    onClick={() => window.open("https://wa.me/919876543210", "_blank")}
                    >
                    Chat on WhatsApp
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => navigate("/consultation")}>
                    Book Free Consultation
                    </Button>
                </div>
                </CardContent>
            </Card>
            </div>
        </main>
        </div>
    );
    }