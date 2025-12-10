
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { Mode, Project, Message, Role, MessageType, ImageSettings, ChatSession, ModeType } from './types';
import { MODES, MOCK_PROJECTS } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import { loadSessions, saveSession, downloadSessionAsTxt, deleteSession } from './services/historyService';

function App() {
  const [currentMode, setMode] = useState<Mode>(MODES[0]);
  const [currentProject, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Session Management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Custom Cursor Logic
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Init
  useEffect(() => {
    // Load History
    const loaded = loadSessions();
    setSessions(loaded);

    // Cursor tracking
    const moveCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  // Update session in storage whenever messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
        const sessionToUpdate = sessions.find(s => s.id === currentSessionId);
        if (sessionToUpdate) {
            const updatedSession: ChatSession = {
                ...sessionToUpdate,
                messages: messages,
                modeId: currentMode.id,
                projectId: currentProject?.id || null
            };
            const updatedList = saveSession(updatedSession);
            setSessions(updatedList);
        }
    }
  }, [messages, currentSessionId, currentMode, currentProject]);

  const handleSendMessage = async (text: string, attachments: any[], imageSettings?: ImageSettings) => {
    // 1. Session Initialization (if first message)
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
            id: newId,
            title: text.length > 30 ? text.substring(0, 30) + '...' : text,
            lastModified: Date.now(),
            messages: [],
            modeId: currentMode.id,
            projectId: currentProject?.id || null
        };
        const updatedSessions = saveSession(newSession);
        setSessions(updatedSessions);
        setCurrentSessionId(newId);
        activeSessionId = newId;
    }

    // 2. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      type: MessageType.TEXT,
      timestamp: Date.now(),
      attachments: attachments
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 3. Call API
    const response = await sendMessageToGemini(messages, currentMode, currentProject, text, attachments, imageSettings);

    setIsTyping(false);

    // 4. Add AI Response
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: Role.MODEL,
      content: response.text,
      type: response.images ? MessageType.IMAGE : MessageType.TEXT,
      timestamp: Date.now(),
      attachments: response.images ? response.images.map(img => ({ type: 'image/png', data: img, name: 'generated.png' })) : [],
      groundingMetadata: response.groundingMetadata
    };

    setMessages(prev => [...prev, aiMsg]);
  };

  const handleLoadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    
    // Restore Mode
    const savedMode = MODES.find(m => m.id === session.modeId);
    if (savedMode) setMode(savedMode);
    
    // Restore Project
    const savedProject = MOCK_PROJECTS.find(p => p.id === session.projectId);
    setProject(savedProject || null);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setMode(MODES[0]);
    setProject(null);
  };

  const handleDeleteSession = (id: string) => {
      const updated = deleteSession(id);
      setSessions(updated);
      if (currentSessionId === id) {
          handleNewChat();
      }
  };

  return (
    <div className="flex h-screen w-full bg-jet text-gray-100 font-sans selection:bg-gold-dim/30 relative overflow-hidden">
      {/* Background System */}
      <div className="absolute inset-0 bg-grid-pattern z-0 opacity-40 pointer-events-none"></div>
      <div className="bg-grain"></div>

      {/* Custom Cursor Elements */}
      <div className="cursor-dot hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y }}></div>
      <div className="cursor-outline hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y, transition: 'transform 0.15s ease-out' }}></div>

      {/* App Content */}
      <div className="z-10 flex w-full h-full">
        <Sidebar 
            sessions={sessions}
            currentSessionId={currentSessionId}
            projects={MOCK_PROJECTS}
            currentProjectId={currentProject?.id || null}
            onLoadSession={handleLoadSession}
            onNewChat={handleNewChat}
            onDownloadSession={downloadSessionAsTxt}
            onDeleteSession={handleDeleteSession}
            onSelectProject={setProject}
        />
        <ChatInterface 
          currentMode={currentMode}
          setMode={setMode}
          currentProject={currentProject}
          setProject={setProject}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
}

export default App;
