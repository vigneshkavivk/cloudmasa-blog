// src/components/MCPBot.jsx
import React from "react";

const BOT_IFRAME_URL = "http://20.245.200.81/";

const MCPBot = () => {
  return (
    <div className="w-full h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <iframe
        src={BOT_IFRAME_URL}
        title="MCP Bot Assistant"
        className="block w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer"
        allow="clipboard-read; clipboard-write; microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
        // ❌ Remove inline style — it's causing the 75% constraint
      />
    </div>
  );
};

export default MCPBot;
