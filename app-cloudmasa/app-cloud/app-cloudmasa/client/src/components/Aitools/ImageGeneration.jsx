// src/components/Aitools/ImageGeneration.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';
const engines = [
  {
    name: "HuggingFace Spaces",
    desc: "Open-source Stable Diffusion demos",
    url: "https://huggingface.co/spaces",
  },
  {
    name: "Playground AI",
    desc: "Free tier AI art generator",
    url: "https://playgroundai.com",
  },
  {
    name: "Leonardo AI",
    desc: "Free daily image credits",
    url: "https://leonardo.ai",
  },
  {
    name: "Mage Space",
    desc: "Stable Diffusion generator",
    url: "https://www.mage.space",
  },
  {
    name: "DeepAI",
    desc: "Simple text-to-image tool",
    url: "https://deepai.org/machine-learning-model/text2img",
  },
  {
    name: "Bing Image Creator",
    desc: "DALL·E powered free image generator",
    url: "https://www.bing.com/images/create",
  },
  {
    name: "Adobe Firefly",
    desc: "Free AI art generation (credits based)",
    url: "https://firefly.adobe.com",
  },
  {
    name: "Canva AI",
    desc: "AI image generator inside Canva (Free tier)",
    url: "https://www.canva.com/ai-image-generator/",
  },
  {
    name: "NightCafe",
    desc: "Daily free AI art credits",
    url: "https://creator.nightcafe.studio/",
  },
  {
    name: "Ideogram",
    desc: "Great for AI text-to-image with typography",
    url: "https://ideogram.ai",
  },
  {
    name: "SeaArt AI",
    desc: "Free anime & SD image generator",
    url: "https://www.seaart.ai",
  },
  {
    name: "PixAI",
    desc: "Free anime-style AI art generator",
    url: "https://pixai.art",
  }
];


export default function ImageGeneration() {
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
        <h1 className="ml-4 text-2xl font-bold text-white">Image Generation</h1>
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
