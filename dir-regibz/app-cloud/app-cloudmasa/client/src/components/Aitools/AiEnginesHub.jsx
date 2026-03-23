import React from 'react';
import { useNavigate } from 'react-router-dom';

const tools = [
  {
    id: 'image',
    title: 'Image Generation',
    icon: '🖼️',
    desc: 'Generate images from text prompts',
    gradient: 'from-pink-500 to-orange-500',
  },
  {
    id: 'video',
    title: 'Video Generation',
    icon: '🎬',
    desc: 'Create AI-powered videos',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'chat',
    title: 'Chat AI',
    icon: '💬',
    desc: 'Conversational AI assistants',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'tts',
    title: 'Text to Speech',
    icon: '🎧',
    desc: 'Convert text into natural voice',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'code',
    title: 'Code Assistant',
    icon: '🧠',
    desc: 'AI help for developers',
    gradient: 'from-yellow-400 to-amber-500',
  },
];

const AiToolsHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            AI <span className="text-cyan-400">Creation Hub</span>
          </h1>
          <p className="text-gray-400">
            One platform. Multiple AI powers.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map(tool => (
            <div
              key={tool.id}
              onClick={() => navigate(`/sidebar/ai/${tool.id}`)}
              className="group cursor-pointer rounded-2xl p-6 bg-[#111827] border border-white/10 hover:border-cyan-400/40 transition-all"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${tool.gradient} mb-5`}>
                {tool.icon}
              </div>

              <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition">
                {tool.title}
              </h3>

              <p className="text-sm text-gray-400">
                {tool.desc}
              </p>

              <div className="mt-4 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                Open →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiToolsHub;
