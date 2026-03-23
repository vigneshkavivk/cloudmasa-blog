// client/src/components/AiEnginesHub.jsx
import React, { useMemo } from 'react';

const AiEnginesHub = () => {
  // 🔹 AI Engines Data (customizable)
  const engines = useMemo(() => [
    {
      id: 'midjourney',
      name: 'Midjourney',
      icon: '⛵',
      description: 'Creative image generation',
      status: 'active',
      category: 'Image Generation',
    },
    {
      id: 'sunay',
      name: 'Sunay',
      icon: '☀️',
      description: 'AI-powered design & imagery',
      status: 'active',
      category: 'Image Generation',
    },
    {
      id: 'runway',
      name: 'Runway',
      icon: '🎬',
      description: 'AI-powered video generation',
      status: 'active',
      category: 'Video Generation',
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: '💬',
      description: 'Conversational AI assistant',
      status: 'active',
      category: 'Conversational AI',
    },
    {
      id: 'copilot',
      name: 'Copilot',
      icon: '💻',
      description: 'AI-powered code assistant',
      status: 'active',
      category: 'Code Assistant',
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '🧠',
      description: 'Thoughtful AI companion',
      status: 'active',
      category: 'Conversational AI',
    },
    {
      id: 'custom',
      name: 'Custom AI',
      icon: '⚙️',
      description: 'Your custom AI model',
      status: 'coming-soon',
      category: 'Custom',
    },
  ], []);

  const handleOpen = (id) => {
    if (id === 'custom') return;
    // 🔥 Replace with your actual logic:
    // - navigate('/ai/midjourney')
    // - openModal(id)
    // - call API
    alert(`Opening ${id}...`);
  };

  // Status badge renderer
  const renderStatusBadge = (status) => {
    const config = {
      active: { text: 'Active', bg: 'bg-emerald-500/20', textClass: 'text-emerald-300' },
      'coming-soon': { text: 'Coming Soon', bg: 'bg-yellow-500/20', textClass: 'text-yellow-300' },
    }[status] || { text: 'Unknown', bg: 'bg-gray-600/30', textClass: 'text-gray-400' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] rounded-full font-medium ${config.bg} ${config.textClass}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* === Global Theme Styles (same as ToolsUI) === */}
      <style jsx>{`
        .ai-engine-root {
          background:
            radial-gradient(circle at 10% 20%, rgba(30, 58, 138, 0.08) 0%, transparent 30%),
            radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.05) 0%, transparent 40%),
            linear-gradient(125deg, #0a0d1a 0%, #0b0e1c 35%, #0c1020 65%, #0d1124 100%);
          color: #e5e7eb;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
        }
        .grid-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image:
            linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
          background-size: 40px 40px; pointer-events: none; z-index: -2;
        }
        .animated-gradient {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: conic-gradient(from 0deg, #38bdf8, #60a5fa, #7dd3fc, #38bdf8);
          background-size: 300% 300%;
          animation: gradientShift 28s ease-in-out infinite;
          opacity: 0.08; filter: blur(65px); z-index: -1;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .card-glow {
          border: 1px solid rgba(56, 189, 248, 0.15);
          box-shadow: 0 4px 20px rgba(56, 189, 248, 0.08);
          transition: all 0.3s ease;
        }
        .card-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.3);
        }
      `}</style>

      <div className="ai-engine-root">
        <div className="grid-overlay" />
        <div className="animated-gradient" />

        {/* Floating particles (optional) */}
        {[{top:'10%',left:'5%'},{top:'25%',left:'85%'},{top:'65%',left:'18%'},{top:'82%',left:'75%'}].map((p,i)=>(
          <div key={i} className="absolute w-1 h-1 rounded-full bg-cyan-400/30 animate-pulse"
               style={{top:p.top,left:p.left,animationDelay:`${i*2}s`}} />
        ))}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Engines
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Access multiple AI tools from one place — seamlessly integrated with your DevOps workflow.
            </p>
          </div>

          {/* Engine Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {engines.map((engine) => (
              <div
                key={engine.id}
                className="relative bg-gradient-to-b from-[#161b22] to-[#1e252d] rounded-xl p-5 text-white shadow-lg overflow-hidden group card-glow transition-all duration-300"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">{engine.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      {engine.name}
                    </h3>
                    {renderStatusBadge(engine.status)}
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {engine.description}
                </p>

                <span className="inline-block px-2 py-1 text-xs rounded bg-white/5 text-gray-300 mb-4">
                  {engine.category}
                </span>

                <button
                  onClick={() => handleOpen(engine.id)}
                  disabled={engine.status === 'coming-soon'}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    engine.status === 'coming-soon'
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600'
                  }`}
                >
                  {engine.status === 'coming-soon' ? 'Coming Soon' : 'Open'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiEnginesHub;
