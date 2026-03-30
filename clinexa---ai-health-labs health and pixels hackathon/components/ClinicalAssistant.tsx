
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, MessageSquare, X, Activity, Brain, ShieldAlert, RefreshCw, Send, Sparkles, ArrowRight, Loader2, Volume2 } from 'lucide-react';
import { AIAnalysis } from '../types';

interface ClinicalAssistantProps {
  analysis: AIAnalysis;
  onClose: () => void;
}

export const ClinicalAssistant: React.FC<ClinicalAssistantProps> = ({ analysis, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [isConnecting, setIsConnecting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system', text: string }[]>([]);
  
  const streamingAssistantTextRef = useRef('');
  const streamingUserTextRef = useRef('');
  const [streamingUpdate, setStreamingUpdate] = useState(0);
  const [textInput, setTextInput] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Gemini Live API compliant base64 utils
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingUpdate, isThinking]);

  const startAssistant = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputCtx.resume();
      await outputCtx.resume();
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      outputNodeRef.current = outputNode;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setMessages([{ role: 'system', text: 'Secure Bio-Link Synchronized.' }]);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn || message.serverContent?.outputTranscription) {
              setIsThinking(false);
            }

            if (message.serverContent?.outputTranscription) {
              streamingAssistantTextRef.current += message.serverContent.outputTranscription.text;
              setStreamingUpdate(v => v + 1);
            } else if (message.serverContent?.inputTranscription) {
              streamingUserTextRef.current += message.serverContent.inputTranscription.text;
              setStreamingUpdate(v => v + 1);
              setIsThinking(true);
            }
            
            if (message.serverContent?.turnComplete) {
              const assistantText = streamingAssistantTextRef.current.trim();
              const userText = streamingUserTextRef.current.trim();
              
              if (assistantText || userText) {
                setMessages(prev => {
                  const updated = [...prev];
                  if (userText) updated.push({ role: 'user', text: userText });
                  if (assistantText) updated.push({ role: 'assistant', text: assistantText });
                  return updated;
                });
              }
              
              streamingAssistantTextRef.current = '';
              streamingUserTextRef.current = '';
              setIsThinking(false);
              setStreamingUpdate(v => v + 1);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsThinking(false);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current!);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                try { source.stop(); } catch(e) {}
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
              setIsThinking(false);
            }
          },
          onerror: (e: any) => {
            console.error('Session Sync Failure:', e);
            const msg = e?.message || "";
            if (msg.includes("429") || msg.includes("quota")) {
               setError('Neural link limit reached. System capacity at maximum.');
            } else {
               setError('Secure link disrupted. Check biometric sensor permissions (mic).');
            }
            setIsActive(false);
            setIsConnecting(false);
            setIsThinking(false);
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
            setIsThinking(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the Clinexa Reasoning Engine. You are discussing a generated clinical report.
          
          CASE DATA:
          - Summary: ${analysis.briefSummary}
          - Urgency: ${analysis.urgency}
          - Risk: ${analysis.riskScore}/100
          - Symptoms: ${analysis.extractedSymptoms.join(', ')}
          
          GUIDELINES:
          1. Answer patient or clinician questions about this report.
          2. Explain medical reasoning precisely.
          3. Be professional, empathetic, and concise. 
          4. If user asks for advice beyond the report, recommend physician consultation while providing safe context.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        if (isMuted || !isActive) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
        
        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000'
            }
          });
        }).catch(() => {});
      };
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);
      
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      console.error('Link failure:', err);
      setError('Biometric Link Denied: Microphone access required for neural reasoning sync.');
      setIsConnecting(false);
    }
  };

  const handleSendText = (textOverride?: string) => {
    const messageText = textOverride || textInput.trim();
    if (!messageText || !isActive) return;
    
    if (!textOverride) setTextInput('');
    
    setMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setIsThinking(true);

    // FIXED: Live session requires sendRealtimeInput for text parts as well
    sessionPromiseRef.current?.then((session) => {
      session.sendRealtimeInput({
        parts: [{ text: messageText }]
      });
    }).catch(err => {
      console.error("Packet loss in clinical link:", err);
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'system', text: 'Transmission Failure: Diagnostic packet lost.' }]);
    });
  };

  const suggestedPrompts = [
    `Why is the risk ${analysis.riskScore}%?`,
    "List the red flags",
    "Explain the possible causes",
    "What are the next steps?"
  ];

  useEffect(() => {
    startAssistant();
    return () => {
      sessionPromiseRef.current?.then((s: any) => s?.close()).catch(() => {});
      sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
      audioContextRef.current?.close();
      inputContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-[420px] h-[720px] bg-white rounded-3xl border border-slate-200 shadow-[0_40px_80px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 transition-all">
      {/* Refined Clinical Header */}
      <div className="bg-indigo-600 p-5 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 ${isThinking ? 'animate-pulse' : ''}`}>
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black leading-tight tracking-tight">Clinexa AI Core</h4>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-white/30'}`}></div>
               <span className="text-[10px] text-white/80 uppercase tracking-widest font-black">
                 {isThinking ? 'Reasoning...' : isActive ? 'Live Link' : 'Connecting...'}
               </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
          <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center mb-8 shadow-inner ${error.includes('Denied') ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
            <ShieldAlert className={`w-10 h-10 ${error.includes('Denied') ? 'text-amber-500' : 'text-red-500'}`} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Link Disrupted</h3>
          <p className="text-xs text-slate-500 mb-10 leading-relaxed font-medium px-4">{error}</p>
          <button 
            onClick={() => { setError(null); startAssistant(); }}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Establish New Link
          </button>
        </div>
      ) : (
        <>
          {/* Diagnostic Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scroll-smooth no-scrollbar">
            {isConnecting ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-indigo-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Syncing Reasoning Units</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest animate-pulse">Initializing Bio-Feedback Bridge...</p>
                </div>
              </div>
            ) : messages.length === 0 && !streamingAssistantTextRef.current && !streamingUserTextRef.current ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner animate-pulse">
                  <Sparkles className="w-10 h-10 text-indigo-300" />
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Interactive Workspace Active</h4>
                <p className="text-xs font-semibold text-slate-400 mb-10 leading-relaxed px-6">
                  Ready to assist with clinical reasoning on the current report findings.
                </p>
                <div className="grid grid-cols-1 gap-3 w-full">
                  {suggestedPrompts.map((p, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendText(p)}
                      className="p-4 text-left text-[11px] font-black text-indigo-600 bg-white border border-indigo-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-between group shadow-sm active:scale-95"
                    >
                      {p}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'assistant' ? 'justify-start' : 'justify-center'}`}>
                    {m.role === 'system' ? (
                      <div className="bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{m.text}</span>
                      </div>
                    ) : (
                      <div className={`max-w-[90%] p-4 rounded-3xl text-[13px] font-semibold leading-relaxed shadow-sm border ${
                        m.role === 'user' 
                          ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                          : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                
                {streamingUserTextRef.current && (
                  <div className="flex justify-end">
                    <div className="max-w-[90%] p-4 rounded-3xl rounded-tr-none text-[13px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 italic animate-pulse">
                      {streamingUserTextRef.current}
                    </div>
                  </div>
                )}
                {streamingAssistantTextRef.current && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] p-4 rounded-3xl rounded-tl-none text-[13px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm">
                      {streamingAssistantTextRef.current}
                    </div>
                  </div>
                )}

                {isThinking && !streamingAssistantTextRef.current && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="bg-slate-50 px-5 py-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-4 shadow-sm">
                      <div className="flex gap-1.5">
                         <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analysing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Clinical Console */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-6 shrink-0">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                placeholder="Inquire clinical data..."
                disabled={isConnecting || !isActive}
                className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm disabled:bg-slate-100"
              />
              <button 
                onClick={() => handleSendText()}
                disabled={!textInput.trim() || isConnecting || !isActive}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  !textInput.trim() || isConnecting || !isActive 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl active:scale-90'
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-10 pb-2">
              <div className="flex flex-col items-end gap-1 min-w-[120px]">
                 <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${isMuted ? 'text-red-400' : 'text-slate-400'}`}>
                    {isMuted ? 'Mic Offline' : 'Mic Stream Active'}
                 </span>
                 <span className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">Diagnostic Audio Link</span>
              </div>

              <button 
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (newMuted) setIsThinking(false);
                }}
                disabled={isConnecting}
                className={`w-18 h-18 rounded-[2rem] flex items-center justify-center transition-all relative border-2 ${
                  isConnecting ? 'bg-slate-100 text-slate-200 border-slate-50' :
                  isMuted ? 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 shadow-sm p-5' : 
                  'bg-indigo-600 text-white border-indigo-400 shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 p-6'
                }`}
              >
                {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                {!isMuted && isActive && (
                   <span className="absolute -inset-2 rounded-[2.5rem] border-2 border-indigo-500 animate-ping opacity-10"></span>
                )}
              </button>
              
              <div className="flex flex-col items-start gap-1 min-w-[120px]">
                {!isMuted && isActive ? (
                  <div className="flex gap-2 items-end h-5">
                    {[1,2,3,4,5,6].map(i => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-indigo-500 rounded-full animate-bounce" 
                        style={{ height: `${20 + Math.random() * 80}%`, animationDuration: `${0.3 + Math.random() * 0.4}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3 h-3 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-300 uppercase">Standby</span>
                  </div>
                )}
                {isConnecting && (
                   <span className="text-[9px] font-black text-indigo-400 uppercase animate-pulse">Syncing...</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
