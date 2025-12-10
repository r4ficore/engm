import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Globe, Mic, AudioLines, ChevronDown, Sparkles, Folder, Cpu, Zap, Search, Settings2, X, BookOpen, TrendingUp, Copy, Check, Database, Settings } from 'lucide-react';
import { Message, MessageType, Role, Mode, Project, ModeType, APIProvider, ImageSettings } from '../types';
import { MOCK_PROJECTS, MODES } from '../constants';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  currentMode: Mode;
  setMode: (mode: Mode) => void;
  currentProject: Project | null;
  setProject: (project: Project | null) => void;
  messages: Message[];
  onSendMessage: (text: string, attachments: any[], imageSettings?: ImageSettings) => void;
  isTyping: boolean;
}

// Add speech recognition types to window
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentMode, setMode, currentProject, setProject, messages, onSendMessage, isTyping 
}) => {
  const [inputText, setInputText] = useState('');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Microphone State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image Generation State
  const [previousMode, setPreviousMode] = useState<Mode | null>(null);
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    aspectRatio: '1:1',
    format: 'image/png'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- Memory Calculation (Simulated) ---
  // Starts at 42% to simulate system overhead/base context, then grows with messages
  const memoryUsage = React.useMemo(() => {
    const totalChars = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0);
    const limit = 50000; 
    const realUsage = Math.round((totalChars / limit) * 100);
    // Base 42% + Real Usage, capped at 100%
    return Math.min(100, 42 + realUsage);
  }, [messages]);

  // --- Copy Functionality ---
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Speech Recognition Logic ---
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pl-PL'; // Set to Polish

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputText(prev => prev + ' ' + finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- Toggle Logic ---

  const handleSearchToggle = () => {
    if (currentMode.id === ModeType.MARKET_RESEARCH) {
        // Toggle OFF: Revert to General
        setMode(MODES.find(m => m.id === ModeType.GENERAL) || MODES[0]);
    } else {
        // Toggle ON: Switch to Market Research (Tavily)
        setMode(MODES.find(m => m.id === ModeType.MARKET_RESEARCH) || MODES[4]);
    }
  };

  const handleImageGenToggle = () => {
    const isCurrentlyImageMode = currentMode.id === ModeType.IMAGE_GEN;

    if (isCurrentlyImageMode) {
        // Toggle OFF: Revert to previous mode or default
        if (previousMode && previousMode.id !== ModeType.IMAGE_GEN) {
            setMode(previousMode);
        } else {
            setMode(MODES[0]); // Default to general
        }
        setPreviousMode(null);
        setIsImageSettingsOpen(false);
    } else {
        // Toggle ON: Save current and Switch to Image Gen
        setPreviousMode(currentMode);
        const imageMode = MODES.find(m => m.id === ModeType.IMAGE_GEN);
        if (imageMode) setMode(imageMode);
        setIsImageSettingsOpen(true);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    // If in Image Mode, pass settings
    const settingsToSend = currentMode.id === ModeType.IMAGE_GEN ? imageSettings : undefined;
    
    onSendMessage(inputText, [], settingsToSend);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen relative bg-jet overflow-hidden">
      {/* Top Bar - Glass Effect */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-end bg-gradient-to-b from-jet via-jet/90 to-transparent h-28 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
             {/* Breadcrumbs / Status */}
             <div className="flex items-center gap-2 text-[10px] font-mono text-gold-dim uppercase tracking-widest opacity-70">
                <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gold'}`}></span>
                System Ready // {currentMode.provider}
             </div>

            <div className="flex items-center gap-4">
                {/* Mode Selector */}
                <div className="relative">
                    <button 
                        onClick={() => setIsModeOpen(!isModeOpen)}
                        className="flex items-center gap-2 bg-graphite/40 border border-white/5 hover:border-gold/30 text-gray-200 px-4 py-2 rounded-sm text-sm font-display font-medium transition-all backdrop-blur-sm"
                    >
                        {currentMode.name}
                        <ChevronDown size={14} className={`text-gold-dim transition-transform ${isModeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isModeOpen && (
                        <div className="absolute top-full mt-2 left-0 w-72 bg-jet border border-gold/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                            {MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => { setMode(mode); setIsModeOpen(false); }}
                                    className={`text-left w-full px-4 py-3 text-sm flex items-center gap-3 group border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${currentMode.id === mode.id ? 'bg-white/5' : ''}`}
                                >
                                    <div className={`mt-0.5 ${currentMode.id === mode.id ? 'text-gold' : 'text-gray-500 group-hover:text-gold-dim'}`}>
                                    {mode.id === ModeType.IMAGE_GEN && <ImageIcon size={16} />}
                                    {mode.id === ModeType.MARKET_RESEARCH && <Globe size={16} />}
                                    {mode.id === ModeType.GENERAL && <Sparkles size={16} />}
                                    {(mode.id === ModeType.EBOOK || mode.id === ModeType.LANDING_PAGE) && <Folder size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-display font-medium flex items-center justify-between ${currentMode.id === mode.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {mode.name}
                                        </div>
                                        <div className="text-[10px] text-gray-600 font-mono mt-0.5 uppercase">{mode.provider.split(' ')[0]}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Selector */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProjectOpen(!isProjectOpen)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors font-mono text-xs uppercase tracking-wide px-2"
                    >
                        <Folder size={14} />
                        <span className="border-b border-dashed border-gray-700 pb-0.5 hover:border-gold">{currentProject ? currentProject.name : "Select Context"}</span>
                    </button>
                    {isProjectOpen && (
                        <div className="absolute top-full mt-2 left-0 w-64 bg-jet border border-gold/20 shadow-2xl p-1 z-50">
                            <div className="px-3 py-2 text-[10px] font-bold font-mono text-gold-dim uppercase tracking-wider border-b border-white/5">Available Contexts</div>
                            <button 
                                onClick={() => { setProject(null); setIsProjectOpen(false); }}
                                className="w-full text-left px-3 py-3 text-xs font-mono text-gray-400 hover:bg-white/5 hover:text-white"
                            >
                                [RESET_CONTEXT]
                            </button>
                            {MOCK_PROJECTS.map(proj => (
                                <button
                                    key={proj.id}
                                    onClick={() => { setProject(proj); setIsProjectOpen(false); }}
                                    className={`w-full text-left px-3 py-3 text-sm group ${currentProject?.id === proj.id ? 'bg-white/5 border-l-2 border-gold' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="font-display font-medium text-gray-200">{proj.name}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Side: Memory Indicator (Top Right) */}
        <div className="pointer-events-auto flex items-center gap-4 mb-2">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl">
                {/* Memory Usage Circle - Enlarged */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                        {/* Background Circle */}
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                        {/* Progress Circle */}
                        <circle 
                            cx="24" cy="24" r="20" 
                            stroke="currentColor" strokeWidth="3" fill="transparent" 
                            className={`${memoryUsage > 90 ? 'text-red-500' : 'text-gold'}`}
                            strokeDasharray={2 * Math.PI * 20} 
                            strokeDashoffset={2 * Math.PI * 20 * (1 - memoryUsage / 100)} 
                            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                        />
                    </svg>
                    {/* Centered Percentage Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-[11px] font-mono font-bold text-gray-200">{memoryUsage}%</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-display font-bold text-gray-200 tracking-widest">PAMIĘĆ</span>
                    <span className="text-[9px] font-mono text-gold-dim">{memoryUsage > 90 ? 'CRITICAL LEVEL' : 'SYSTEM OPTIMAL'}</span>
                </div>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
                
                <button className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full" title="Memory Settings">
                    <Settings size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-32 pb-40 px-4 scroll-smooth z-10">
        <div className="max-w-5xl mx-auto">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="w-16 h-16 rounded-full border border-gold/20 relative flex items-center justify-center mb-8 animate-float">
                        <div className="absolute inset-0 rounded-full border border-gold/10 scale-125 animate-pulse-slow"></div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold/20 to-transparent blur-xl"></div>
                        <Sparkles size={20} className="text-gold opacity-80" />
                    </div>
                    
                    <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">
                        <span className="text-gradient-gold">ENIGMA SYSTEM</span> ONLINE
                    </h1>
                    <p className="text-sm font-mono text-gray-500 mb-10 tracking-widest uppercase">
                        Awaiting input sequence for {currentMode.name}
                    </p>
                    
                    {/* Empty State Suggestions - Enigma Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                        {/* ENIGMA VISION - Image Gen */}
                        <SuggestionBox 
                            icon={<ImageIcon size={16} />} 
                            text="ENIGMA VISION" 
                            sub="Visual Synthesis" 
                            onClick={() => {
                                const mode = MODES.find(m => m.id === ModeType.IMAGE_GEN);
                                if (mode) {
                                    setMode(mode);
                                    setIsImageSettingsOpen(true);
                                }
                            }} 
                        />
                        
                        {/* ENIGMA STORY - Ebook */}
                        <SuggestionBox 
                            icon={<BookOpen size={16} />} 
                            text="ENIGMA STORY" 
                            sub="Narrative Architecture" 
                            onClick={() => {
                                const mode = MODES.find(m => m.id === ModeType.EBOOK);
                                if (mode) setMode(mode);
                            }} 
                        />
                        
                        {/* ENIGMA VALUE - Market Research */}
                        <SuggestionBox 
                            icon={<Globe size={16} />} 
                            text="ENIGMA VALUE" 
                            sub="Market Intelligence" 
                            onClick={() => {
                                const mode = MODES.find(m => m.id === ModeType.MARKET_RESEARCH);
                                if (mode) setMode(mode);
                            }} 
                        />
                        
                        {/* ENIGMA SCALE - Landing Page */}
                        <SuggestionBox 
                            icon={<TrendingUp size={16} />} 
                            text="ENIGMA SCALE" 
                            sub="Growth & CRO" 
                            onClick={() => {
                                const mode = MODES.find(m => m.id === ModeType.LANDING_PAGE);
                                if (mode) setMode(mode);
                            }} 
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-6 ${msg.role === Role.USER ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center text-[10px] font-mono border ${
                                msg.role === Role.USER 
                                ? 'bg-graphite border-gold/30 text-gold shadow-[0_0_10px_rgba(214,179,118,0.1)]' 
                                : 'bg-transparent border-white/10 text-gray-500'
                            }`}>
                                {msg.role === Role.USER ? 'USR' : 'SYS'}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[85%] relative group ${
                                msg.role === Role.USER 
                                ? 'bg-graphite border border-white/5 rounded-sm p-5 text-gray-100 shadow-lg' 
                                : 'bg-transparent text-gray-300 px-0 pt-0'
                            }`}>
                                {msg.content && (
                                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-gold prose-p:font-sans prose-p:leading-7 prose-code:font-mono prose-code:text-gold-dim prose-code:bg-black/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                )}
                                
                                {/* Image Display */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {msg.attachments.map((att, idx) => (
                                            <div key={idx} className="relative group overflow-hidden rounded-sm border border-gold/20">
                                                <img src={att.data} alt="Generated" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                    <span className="text-[10px] font-mono text-gold uppercase">Asset_0{idx+1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Grounding Metadata (Sources) */}
                                {msg.groundingMetadata?.groundingChunks && (
                                    <div className="mt-6 pt-4 border-t border-white/5">
                                        <p className="text-[10px] font-mono text-gold-dim mb-3 uppercase tracking-widest flex items-center gap-2">
                                            <Search size={10} /> Data Sources Verified
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => 
                                                chunk.web?.uri ? (
                                                    <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="bg-black border border-white/10 hover:border-gold/50 text-gray-400 hover:text-gold text-[10px] px-3 py-1.5 rounded-sm transition-all font-mono truncate max-w-[200px]">
                                                        [{i + 1}] {chunk.web.title || new URL(chunk.web.uri).hostname}
                                                    </a>
                                                ) : null
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Copy Button for AI Messages */}
                                {msg.role === Role.MODEL && (
                                    <div className="mt-2 flex justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleCopy(msg.content, msg.id)}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] text-gray-500 hover:text-gold hover:bg-white/5 transition-colors"
                                            title="Copy to clipboard"
                                        >
                                            {copiedId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                            <span className="font-mono">{copiedId === msg.id ? 'COPIED' : 'COPY'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-6 animate-pulse">
                             <div className="w-8 h-8 rounded-sm border border-white/10 flex items-center justify-center bg-transparent">
                                <Cpu size={14} className="text-gray-600" />
                             </div>
                             <div className="flex items-center gap-1 h-8">
                                <span className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1 h-1 bg-gold rounded-full animate-bounce"></span>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-jet via-jet to-transparent z-20 pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto relative">
            
            {/* Image Settings Popover */}
            {currentMode.id === ModeType.IMAGE_GEN && isImageSettingsOpen && (
                <div className="absolute bottom-full mb-4 left-10 bg-jet border border-gold/30 p-4 rounded-sm shadow-[0_0_20px_rgba(214,179,118,0.1)] w-64 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 z-50">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <span className="text-xs font-display font-bold text-gold uppercase tracking-widest">Nano Pro Config</span>
                        <button onClick={() => setIsImageSettingsOpen(false)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-mono text-gray-500 mb-1">ASPECT RATIO</label>
                            <select 
                                value={imageSettings.aspectRatio}
                                onChange={(e) => setImageSettings({...imageSettings, aspectRatio: e.target.value as any})}
                                className="w-full bg-black/50 border border-white/10 text-xs text-gray-200 p-2 rounded-sm focus:border-gold focus:outline-none"
                            >
                                <option value="1:1">Square (1:1)</option>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                                <option value="4:3">Standard (4:3)</option>
                                <option value="3:4">Vertical (3:4)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-gray-500 mb-1">OUTPUT FORMAT</label>
                            <select 
                                value={imageSettings.format}
                                onChange={(e) => setImageSettings({...imageSettings, format: e.target.value as any})}
                                className="w-full bg-black/50 border border-white/10 text-xs text-gray-200 p-2 rounded-sm focus:border-gold focus:outline-none"
                            >
                                <option value="image/png">PNG (Lossless)</option>
                                <option value="image/jpeg">JPEG (Compressed)</option>
                                <option value="image/webp">WEBP (Web Opt)</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className={`glass-panel rounded-none p-1 relative group transition-all duration-300 shadow-2xl ${currentMode.id === ModeType.IMAGE_GEN ? 'border-gold/40 shadow-[0_0_15px_rgba(214,179,118,0.15)]' : 'focus-within:border-gold/40'}`}>
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/30"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/30"></div>

                <div className="flex">
                    {/* Left Toolbar - Reverted to 3 Icons */}
                    <div className="flex flex-col gap-3 p-3 border-r border-white/5 items-center justify-center bg-black/20">
                         {/* Image Toggle */}
                        <button 
                            onClick={handleImageGenToggle}
                            className={`p-2 rounded-sm transition-all duration-300 relative group ${currentMode.id === ModeType.IMAGE_GEN ? 'text-gold bg-gold/10 border border-gold/30 shadow-[0_0_10px_rgba(214,179,118,0.2)]' : 'text-gray-500 hover:text-gray-200'}`}
                            title="Toggle Visual Studio (Fal.ai)"
                        >
                            <ImageIcon size={18} />
                            {currentMode.id === ModeType.IMAGE_GEN && <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full animate-pulse"></div>}
                        </button>
                        
                        {/* Net Toggle */}
                         <button 
                            onClick={handleSearchToggle}
                            className={`p-2 rounded-sm transition-all duration-300 relative group ${currentMode.id === ModeType.MARKET_RESEARCH ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30' : 'text-gray-500 hover:text-gray-200'}`}
                            title="Toggle Web Search (Tavily)"
                        >
                            <Globe size={18} />
                            {currentMode.id === ModeType.MARKET_RESEARCH && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                        </button>

                         <button className="p-2 text-gray-500 hover:text-gray-200 transition-colors" title="Attachments">
                            <Paperclip size={18} onClick={() => fileInputRef.current?.click()} />
                            <input type="file" ref={fileInputRef} className="hidden" />
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isRecording ? "Słucham..." : (currentMode.id === ModeType.IMAGE_GEN ? "Opisz obraz do wygenerowania..." : `Wpisz polecenie dla ${currentMode.name}...`)}
                            className="w-full bg-transparent text-gray-200 placeholder-gray-600 font-sans text-sm px-4 py-4 resize-none focus:outline-none min-h-[140px] pr-24" 
                            rows={1}
                        />

                        {/* Right Internal Toolbar */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-3">
                             {/* Mic */}
                             <button 
                                onClick={toggleRecording}
                                className={`transition-all duration-300 ${isRecording ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-gray-500 hover:text-gray-200'}`}
                             >
                                <Mic size={20} />
                             </button>

                            {/* Send Button - Gold Glow, No Border */}
                            <button 
                                onClick={handleSend}
                                disabled={!inputText.trim() && !isTyping}
                                className={`p-2 transition-all duration-300 ${inputText.trim() ? 'text-gold drop-shadow-[0_0_10px_rgba(214,179,118,0.8)] hover:scale-105' : 'text-gray-600 cursor-not-allowed'}`}
                            >
                                {isTyping ? <AudioLines size={20} className="animate-pulse" /> : <Send size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick, active, tooltip }: any) => (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-mono font-medium text-gray-400 hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-white/10" title={tooltip}>
        {icon}
        {label && <span>{label}</span>}
    </button>
);

const SuggestionBox = ({ icon, text, sub, onClick }: any) => (
    <button onClick={onClick} className="flex flex-col gap-2 p-5 glass-panel hover:bg-white/5 rounded-none text-left transition-all group border border-white/5 hover:border-gold/30">
        <div className="flex items-center gap-3">
            <div className="text-gray-500 group-hover:text-gold transition-colors">{icon}</div>
            <span className="text-sm text-gray-200 font-display font-medium tracking-wide">{text}</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono uppercase pl-9">{sub}</span>
    </button>
);

export default ChatInterface;