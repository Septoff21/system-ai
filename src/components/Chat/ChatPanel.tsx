import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import './ChatPanel.css';

export default function ChatPanel() {
  const { messages, isStreaming, sendMessage, checkOllamaStatus, ollamaRunning } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkOllamaStatus();
  }, [checkOllamaStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !eShiftKey(e)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel hud-panel">
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />

      {/* Ollama status banner */}
      {!ollamaRunning && (
        <div className="chat-status-banner">
          <span className="chat-status-dot chat-status-dot--offline" />
          Ollama not connected — start Ollama to enable AI chat
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isLastAssistant = i === messages.length - 1 && msg.role === 'assistant' && isStreaming;
            return (
              <motion.div
                key={msg.id}
                className={`chat-message chat-message--${msg.role}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="chat-message-marker">
                  {msg.role === 'assistant' ? '◈' : '▸'}
                </div>
                <div className="chat-message-content">
                  {isLastAssistant ? (
                    <StreamingText text={msg.content} />
                  ) : msg.role === 'assistant' ? (
                    <TypewriterText text={msg.content} speed={15} />
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isStreaming && (
          <motion.div
            className="chat-typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="chat-typing-dot" />
            <span className="chat-typing-dot" />
            <span className="chat-typing-dot" />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <span className="chat-input-prompt font-mono">{'>'}</span>
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            className="chat-input font-mono"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ollamaRunning ? 'Enter command...' : 'Waiting for Ollama...'}
            autoComplete="off"
            spellCheck={false}
            disabled={isStreaming}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            id="btn-send"
          >
            ⏎
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Streaming Text (real-time from Ollama) ─────────── */
function StreamingText({ text }: { text: string }) {
  return (
    <span>
      {text}
      <span className="typewriter-cursor">▊</span>
    </span>
  );
}

/* ── Typewriter Effect (for historical messages) ────── */
function TypewriterText({ text, speed }: { text: string; speed: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (speed === 0) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {done ? text : displayed}
      {!done && displayed.length < text.length && (
        <span className="typewriter-cursor">▊</span>
      )}
    </span>
  );
}

function eShiftKey(e: React.KeyboardEvent) {
  return e.shiftKey;
}
