// src/components/Aitools/TextToSpeech.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';

const engines = [
  {
    name: "Google Cloud TTS",
    desc: "Free tier text-to-speech (monthly credits)",
    url: "https://cloud.google.com/text-to-speech",
  },
  {
    name: "ElevenLabs",
    desc: "AI voice generation (Free monthly limit)",
    url: "https://elevenlabs.io",
  },
  {
    name: "Microsoft Azure TTS",
    desc: "Neural voices with free credits",
    url: "https://azure.microsoft.com/en-us/products/ai-services/text-to-speech/",
  },
  {
    name: "Amazon Polly",
    desc: "Free tier neural text-to-speech",
    url: "https://aws.amazon.com/polly/",
  },
  {
    name: "PlayHT",
    desc: "AI voice generator (Free limited plan)",
    url: "https://play.ht",
  },
  {
    name: "Murf AI",
    desc: "AI voice generation (Free trial)",
    url: "https://murf.ai",
  },
  {
    name: "NaturalReader",
    desc: "Free online text-to-speech reader",
    url: "https://www.naturalreaders.com/online/",
  },
  {
    name: "TTSMP3",
    desc: "Simple free text-to-speech tool",
    url: "https://ttsmp3.com",
  },
  {
    name: "HuggingFace TTS Models",
    desc: "Open-source speech generation models",
    url: "https://huggingface.co/models?pipeline_tag=text-to-speech",
  },
  {
    name: "Coqui TTS",
    desc: "Open-source voice AI project",
    url: "https://coqui.ai",
  }
];



export default function TextToSpeech() {
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
        <h1 className="ml-4 text-2xl font-bold text-white">Text to Speech</h1>
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
