
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  ERROR = 'error'
}

export interface Attachment {
  type: string;
  data: string; // base64
  name: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  type: MessageType;
  timestamp: number;
  attachments?: Attachment[];
  groundingMetadata?: any; // For search results
}

export enum ModeType {
  GENERAL = 'General',
  LANDING_PAGE = 'Landing Page Creator',
  EBOOK = 'Ebook Architect',
  IMAGE_GEN = 'Visual Studio',
  MARKET_RESEARCH = 'Market Research'
}

export enum APIProvider {
  GEMINI = 'Gemini 2.5',
  DEEPSEEK = 'Deepseek R1',
  FAL_AI = 'Fal.ai (Nano Banana)',
  TAVILY = 'Tavily Search'
}

export interface ImageSettings {
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' | '9:16';
  format: 'image/png' | 'image/jpeg' | 'image/webp';
}

// Structural Memory Interfaces
export interface ProjectMemory {
  // Context available to ALL modes
  sharedContext: {
    summary: string;
    keyFacts: Record<string, string>;
  };
  // Context private to specific modes
  modeContext: Partial<Record<ModeType, {
    lastState?: string;
    specificInstructions?: string;
    data?: any;
  }>>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  memory: ProjectMemory;
}

export interface Mode {
  id: ModeType;
  name: string;
  description: string;
  systemPrompt: string;
  provider: APIProvider;
  capabilities: ('text' | 'image' | 'search')[];
}

export interface ChatSession {
  id: string;
  title: string;
  lastModified: number;
  messages: Message[];
  modeId: ModeType;
  projectId: string | null;
}
