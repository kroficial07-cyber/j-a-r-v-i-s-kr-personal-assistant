import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AssistantState } from '../types';
import { audioSynthesizer } from '../services/audioService';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Trash2,
  Bot,
  User,
  Sparkles,
  Info,
} from 'lucide-react';

interface ChatScreenProps {
  messages: ChatMessage[];
  assistantState: AssistantState;
  interimTranscript: string;
  onSendMessage: (text: string) => void;
  onToggleVoice: () => void;
  onSpeakText: (text: string) => void;
  onClearHistory: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  assistantState,
  interimTranscript,
  onSendMessage,
  onToggleVoice,
  onSpeakText,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, interimTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    audioSynthesizer.playTap();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 pt-3 pb-24">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">CANAL DE COMUNICAÇÃO NEURAL</h2>
            <div className="text-[11px] font-mono text-cyan-400">
              {assistantState === 'idle' && 'J.A.R.V.I.S. AGUARDANDO COMANDO'}
              {assistantState === 'listening' && 'ESCUTANDO COMANDO DE VOZ (PT-BR)...'}
              {assistantState === 'processing' && 'PROCESSANDO RESPOSTA...'}
              {assistantState === 'speaking' && 'REPRODUZINDO ÁUDIO...'}
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Deseja limpar todo o histórico de conversas salvo localmente?')) {
                audioSynthesizer.playTap();
                onClearHistory();
              }
            }}
            title="Limpar histórico"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 font-mono text-xs">
            <Sparkles className="w-8 h-8 text-cyan-500/40 mb-2" />
            <p className="text-slate-300">Nenhuma conversa registrada.</p>
            <p className="text-slate-400 mt-1">Envie uma mensagem digitada ou pressione o microfone.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isJarvis = msg.sender === 'jarvis';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono text-slate-400">
                  {isUser ? (
                    <>
                      <span>{timeStr}</span>
                      <span>·</span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        VOCÊ <User className="w-3 h-3" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-blue-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" /> J.A.R.V.I.S.
                      </span>
                      <span>·</span>
                      <span>{timeStr}</span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Actions for Jarvis message: Text-to-Speech replay */}
                  {isJarvis && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <button
                        onClick={() => {
                          audioSynthesizer.playTap();
                          onSpeakText(msg.text);
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors py-0.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ouvir Resposta</span>
                      </button>
                      <span className="text-slate-400 text-[10px]">LOCAL ENGINE</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Live Interim Transcript Bubble */}
        {assistantState === 'listening' && interimTranscript && (
          <div className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-none px-4 py-2.5 bg-cyan-950/30 border border-cyan-400/40 text-cyan-300 text-sm italic font-mono animate-pulse">
              "{interimTranscript}..."
            </div>
            <span className="text-[10px] font-mono text-cyan-400 mt-0.5 pr-1">Transcrevendo áudio...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice feedback tip if listening */}
      {assistantState === 'listening' && (
        <div className="my-2 px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 animate-pulse">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Fale agora em português brasileiro (ex: "Status do sistema", "Minhas tarefas")</span>
        </div>
      )}

      {/* Input Controls Bar */}
      <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Microphone button */}
          <button
            type="button"
            onClick={() => {
              audioSynthesizer.playTap();
              onToggleVoice();
            }}
            title={assistantState === 'listening' ? 'Parar escuta' : 'Falar comando'}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-95 ${
              assistantState === 'listening'
                ? 'bg-cyan-500 text-slate-950 glow-cyan animate-pulse'
                : 'bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-slate-800'
            }`}
          >
            {assistantState === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite um comando para o J.A.R.V.I.S...."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500/70 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-400 active:scale-95 transition-all shrink-0 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
