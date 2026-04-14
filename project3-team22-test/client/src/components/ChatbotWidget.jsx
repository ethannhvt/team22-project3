import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! 🐉 I am the Dragon Boba AI. Need help picking a drink?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userMessage = inputMsg.trim();
    setInputMsg('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6) // Send the last 6 messages to keep memory fast and cheap
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Network error connecting to AI.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      {isOpen ? (
        <div className="chatbot__window">
          <div className="chatbot__header">
            <span className="chatbot__header-title">🐉 Dragon AI</span>
            <button className="chatbot__close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chatbot__messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chatbot__bubble chatbot__bubble--${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chatbot__bubble chatbot__bubble--assistant chatbot__bubble--loading">
                <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          <form className="chatbot__input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              value={inputMsg} 
              onChange={e => setInputMsg(e.target.value)} 
              placeholder="Ask me anything..." 
              autoFocus
            />
            <button type="submit" disabled={!inputMsg.trim() || loading}>➤</button>
          </form>
        </div>
      ) : (
        <button className="chatbot__fab" onClick={() => setIsOpen(true)}>
          <span className="chatbot__fab-icon">🤖</span>
        </button>
      )}
    </div>
  );
}
