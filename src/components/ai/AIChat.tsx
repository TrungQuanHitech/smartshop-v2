import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Bot, User, Sparkles, Command } from 'lucide-react';
import { useAIStore } from '@/store/ai.store';
import { cn } from '@/lib/utils';

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const { messages, isProcessing, processMessage, clearHistory } = useAIStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Xử lý cuộn xuống khi có tin nhắn mới
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isProcessing]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;
        const text = input;
        setInput('');
        await processMessage(text);
    };

    // Nhận diện giọng nói (Web Speech API)
    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        if (!isListening) {
            setIsListening(true);
            recognition.start();
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
        } else {
            setIsListening(false);
            recognition.stop();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] no-print">
            {/* Window Chat */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-inner">
                                <Sparkles size={20} className="text-white animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight text-white uppercase">Trợ lý AI Toàn năng</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Đang trực tuyến</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={clearHistory} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400" title="Xóa lịch sử">
                                <Command size={16} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
                        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <div key={idx} className={cn("flex flex-col animate-in fade-in duration-300",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn("flex items-end gap-2 max-w-[85%]",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                                        msg.role === 'user' ? "bg-slate-200" : "bg-indigo-600"
                                    )}>
                                        {msg.role === 'user' ? <User size={14} className="text-slate-600" /> : <Bot size={14} className="text-white" />}
                                    </div>
                                    <div className={cn("p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm font-medium",
                                        msg.role === 'user'
                                            ? "bg-indigo-600 text-white rounded-br-none"
                                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center animate-bounce">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative flex items-center gap-2">
                            <button
                                onClick={toggleListening}
                                className={cn("p-3 rounded-xl transition-all shadow-sm",
                                    isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isListening ? "Đang lắng nghe..." : "Hỏi tôi bất cứ điều gì..."}
                                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isProcessing}
                                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-[9px] text-center text-slate-400 mt-3 font-bold uppercase tracking-[0.2em]">Sử dụng Groq AI để tối ưu hóa hiệu suất</p>
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group overflow-hidden",
                    isOpen ? "bg-slate-900 rotate-90 scale-110" : "bg-indigo-600 hover:scale-110 active:scale-95"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? (
                    <X className="text-white" size={28} />
                ) : (
                    <MessageSquare className="text-white" size={28} />
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">1</span>
                    </span>
                )}
            </button>
        </div>
    );
}
