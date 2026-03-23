// src/components/Aitools/ChatAI.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';

  const engines = [
  { name: "ChatGPT", desc: "OpenAI conversational AI (Free tier)", url: "https://chat.openai.com" },
  { name: "Claude AI", desc: "Anthropic AI assistant (Free tier)", url: "https://claude.ai" },
  { name: "Google Gemini", desc: "Google's AI chatbot (Free)", url: "https://gemini.google.com" },
  { name: "Microsoft Copilot", desc: "AI chat by Microsoft (Free)", url: "https://copilot.microsoft.com" },
  { name: "Perplexity AI", desc: "AI-powered search assistant (Free)", url: "https://perplexity.ai" },
  { name: "HuggingFace Chat", desc: "Open-source AI chat models", url: "https://huggingface.co/chat" },
  { name: "You.com AI", desc: "AI search & chat assistant", url: "https://you.com" },
  { name: "Poe by Quora", desc: "Multi-model AI chat platform", url: "https://poe.com" },
  { name: "GroqChat", desc: "Fast open-source LLM chat", url: "https://groq.com" },
  { name: "DeepSeek Chat", desc: "Free powerful AI chat", url: "https://chat.deepseek.com" }
];


export default function ChatAI() {
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
        <h1 className="ml-4 text-2xl font-bold text-white">Chat AI</h1>
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
