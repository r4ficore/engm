import { ModeType, Mode, Project, APIProvider } from './types';

export const MODES: Mode[] = [
  {
    id: ModeType.GENERAL,
    name: 'AI Assistant',
    description: 'General purpose assistant. Routes tasks.',
    systemPrompt: `You are Axora, a general AI assistant. 
    You have access to Shared Project Memory but NOT mode-specific details unless provided.
    
    CRITICAL RULES:
    1. If the user asks for high-end image generation, suggest the Visual Studio mode.
    2. If the user asks for deep market research, suggest Market Research mode.
    3. Maintain a helpful, professional persona.`,
    provider: APIProvider.GEMINI,
    capabilities: ['text']
  },
  {
    id: ModeType.LANDING_PAGE,
    name: 'Landing Page Creator',
    description: 'Specialist in CRO and Layouts.',
    systemPrompt: `You are a Conversion Rate Optimization (CRO) expert.
    ACCESS: You have access to Shared Memory AND 'Landing Page' specific memory.
    
    You strictly adhere to the Project Context provided.
    Output format should be structured: Hero Section, Value Prop, Features, Social Proof, CTA.`,
    provider: APIProvider.DEEPSEEK, // Simulated via High-Reasoning Model
    capabilities: ['text']
  },
  {
    id: ModeType.EBOOK,
    name: 'Ebook Architect',
    description: 'Long-form structured content.',
    systemPrompt: `You are an expert Ghostwriter and Editor.
    ACCESS: You have access to Shared Memory AND 'Ebook' specific memory (e.g. outlines, current chapter).
    
    You specialize in creating outline-driven, comprehensive ebooks.
    Focus on chapter structure, flow, and educational value.`,
    provider: APIProvider.DEEPSEEK, // Simulated via High-Reasoning Model
    capabilities: ['text']
  },
  {
    id: ModeType.IMAGE_GEN,
    name: 'Visual Studio',
    description: 'Fal.ai Nano Banana Pro emulation.',
    systemPrompt: `You are a Visual Prompt Engineer connected to Fal.ai (Nano Banana Pro). 
    Your task is to take user ideas and refine them into highly descriptive, artistic prompts.
    Then, you generate the image.`,
    provider: APIProvider.FAL_AI,
    capabilities: ['text', 'image']
  },
  {
    id: ModeType.MARKET_RESEARCH,
    name: 'Market Research',
    description: 'Tavily Search emulation.',
    systemPrompt: `You are a Senior Market Analyst connected to Tavily.
    You use search tools to find real-time data, competitor analysis, and market trends.
    Always cite sources. Focus on data-driven insights.`,
    provider: APIProvider.TAVILY,
    capabilities: ['text', 'search']
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Personal Brand',
    description: 'Building a personal brand on LinkedIn for Tech Leadership.',
    memory: {
      sharedContext: {
        summary: 'User is a Senior React Developer wanting to become a thought leader.',
        keyFacts: {
          'Audience': 'CTOs and Engineering Managers',
          'Goals': 'Grow newsletter subscribers'
        }
      },
      modeContext: {
        [ModeType.LANDING_PAGE]: {
            specificInstructions: "Focus on minimal aesthetic, dark mode inspired.",
            lastState: "Hero section draft completed."
        },
        [ModeType.EBOOK]: {
            specificInstructions: "Tone should be slightly contrarian but professional.",
            data: { outline: ["Chapter 1: The Myth of Clean Code", "Chapter 2: Pragmatic Engineering"] }
        }
      }
    }
  },
  {
    id: 'p2',
    name: 'SaaS Startup "Flow"',
    description: 'A project management tool for creative agencies.',
    memory: {
      sharedContext: {
        summary: 'Flow is a B2B SaaS competing with Asana but for designers.',
        keyFacts: {
          'USP': 'Visual-first timelines',
          'Pricing': 'Premium tier focus'
        }
      },
      modeContext: {
        [ModeType.MARKET_RESEARCH]: {
            specificInstructions: "Track competitors: Asana, Monday, Trello.",
            data: { competitors: ["Asana", "Trello"] }
        }
      }
    }
  }
];

export const PLACEHOLDER_AVATAR = "https://picsum.photos/seed/axora/200/200";