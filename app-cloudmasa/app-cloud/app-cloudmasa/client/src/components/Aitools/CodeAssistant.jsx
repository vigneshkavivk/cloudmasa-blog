// src/components/Aitools/CodeAssistant.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';

 const engines = [
  { name: "GitHub Copilot", desc: "AI coding assistant (Paid, trial available)", url: "https://github.com/features/copilot" },
  { name: "Codeium", desc: "Free AI code completion", url: "https://codeium.com" },
  { name: "Tabnine", desc: "AI code assistant (Free tier)", url: "https://www.tabnine.com" },
  { name: "Amazon CodeWhisperer", desc: "Free AI coding assistant for individuals", url: "https://aws.amazon.com/codewhisperer/" },
  { name: "Replit AI", desc: "AI coding in browser (Limited free)", url: "https://replit.com" },
  { name: "Sourcegraph Cody", desc: "AI code search & assistant (Free tier)", url: "https://sourcegraph.com/cody" },
  { name: "Continue.dev", desc: "Open-source AI coding extension", url: "https://continue.dev" },
  { name: "Cursor IDE", desc: "AI-powered code editor (Free trial)", url: "https://cursor.sh" },
  { name: "CodeGeeX", desc: "Free multilingual AI code generator", url: "https://codegeex.cn/en-US" },
  { name: "HuggingFace Code Models", desc: "Open-source code LLMs", url: "https://huggingface.co/models?pipeline_tag=text-generation&search=code" }
];


export default function CodeAssistant() {
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full mr-4"
          aria-label="Back to tools"
        >
          ←
        </button>
        <h1 className="ml-4 text-2xl font-bold text-white">Code Assistant</h1>
      </div>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {engines.map((engine, i) => (
          <div
            key={i}
            className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
          >
            <h2 className="text-white font-semibold mb-2 flex items-center">
              {engine.name}
              <span className="ml-2 text-blue-400">●</span>
            </h2>
            <p className="text-white text-sm mb-4">{engine.desc}</p>
            <button
              onClick={() => window.open(engine.url, "_blank")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              Open Platform →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
