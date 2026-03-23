// src/components/Aitools/VideoGeneration.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';

const engines = [
  {
    name: "Pika Labs",
    desc: "Free AI video generation (limited credits)",
    url: "https://pika.art",
  },
  {
    name: "Runway ML",
    desc: "AI video tools (Free tier available)",
    url: "https://runwayml.com",
  },
  {
    name: "Luma Dream Machine",
    desc: "Text-to-video AI (Free credits)",
    url: "https://lumalabs.ai/dream-machine",
  },
  {
    name: "Kaiber AI",
    desc: "AI video & animation generator",
    url: "https://kaiber.ai",
  },
  {
    name: "PixVerse AI",
    desc: "Free AI video generation credits",
    url: "https://pixverse.ai",
  },
  {
    name: "CapCut AI Video",
    desc: "Free AI video generator online",
    url: "https://www.capcut.com/tools/ai-video-generator",
  },
  {
    name: "Canva AI Video",
    desc: "AI video generator inside Canva (Free tier)",
    url: "https://www.canva.com/ai-video-generator/",
  },
  {
    name: "Leonardo AI Motion",
    desc: "AI image-to-video tool (Free credits)",
    url: "https://leonardo.ai",
  },
  {
    name: "InVideo AI",
    desc: "Text-to-video creator (Free limited)",
    url: "https://invideo.io/ai/",
  },
  {
    name: "HeyGen",
    desc: "AI avatar video generator (Free trial)",
    url: "https://www.heygen.com",
  }
];

export default function VideoGeneration() {
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="bg-white-800 hover:bg-white-700 text-white p-2 rounded-full mr-4"
          aria-label="Back to tools"
        >
          ←
        </button>
        <h1 className="ml-4 text-2xl font-bold text-white">Video Generation</h1>
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
