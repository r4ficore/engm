
import { ChatSession, Message, ModeType } from '../types';

const STORAGE_KEY = 'axora_history_v1';
const RETENTION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

/**
 * Loads sessions from local storage and filters out expired ones.
 */
export const loadSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const sessions: ChatSession[] = JSON.parse(raw);
    const now = Date.now();
    
    // Filter sessions strictly within the retention period
    const validSessions = sessions.filter(s => (now - s.lastModified) < RETENTION_MS);
    
    // If we cleaned up sessions, update storage immediately
    if (validSessions.length !== sessions.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validSessions));
    }
    
    // Return sorted by newest first
    return validSessions.sort((a, b) => b.lastModified - a.lastModified);
  } catch (e) {
    console.error("Failed to load history:", e);
    return [];
  }
};

/**
 * Saves or updates a session in local storage.
 */
export const saveSession = (session: ChatSession): ChatSession[] => {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  const updatedSession = { ...session, lastModified: Date.now() };

  if (index >= 0) {
    sessions[index] = updatedSession;
  } else {
    sessions.unshift(updatedSession);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return sessions;
};

/**
 * Exports a session to a readable text file and triggers download.
 */
export const downloadSessionAsTxt = (session: ChatSession) => {
  if (!session) return;

  const date = new Date(session.lastModified).toLocaleString();
  let content = `========================================\n`;
  content += `AXORA ENIGMA SYSTEM - SESSION LOG\n`;
  content += `========================================\n`;
  content += `SESSION ID: ${session.id}\n`;
  content += `TITLE:      ${session.title}\n`;
  content += `DATE:       ${date}\n`;
  content += `MODE:       ${session.modeId}\n`;
  content += `PROJECT:    ${session.projectId || 'None'}\n`;
  content += `========================================\n\n`;

  session.messages.forEach(msg => {
    const role = msg.role.toUpperCase();
    const time = new Date(msg.timestamp).toLocaleTimeString();
    
    content += `[${time}] ${role}:\n`;
    content += `${msg.content}\n`;
    
    if (msg.attachments && msg.attachments.length > 0) {
      content += `[Attached ${msg.attachments.length} file(s)]\n`;
    }
    
    if (msg.groundingMetadata?.groundingChunks) {
        content += `\n[Sources Used]:\n`;
        msg.groundingMetadata.groundingChunks.forEach((chunk: any, i: number) => {
            if(chunk.web?.uri) content += `   ${i+1}. ${chunk.web.uri}\n`;
        });
    }
    
    content += `\n----------------------------------------\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `axora_log_${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const deleteSession = (id: string): ChatSession[] => {
    const sessions = loadSessions();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
}
