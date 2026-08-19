// Model Registry for AI providers
export interface ModelMetadata {
  id: string;
  provider: string;
  name: string;
  contextSize?: number; // in tokens
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  // Additional metadata as needed
}

// In a real application, this could be fetched from the provider APIs or a config file.
// For now, we hardcode a few models for each provider.
export const MODELS: ModelMetadata[] = [
  // OpenAI models
  {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    contextSize: 4096,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
  },
  {
    id: 'gpt-4',
    provider: 'openai',
    name: 'GPT-4',
    contextSize: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
  },
  {
    id: 'gpt-4-vision-preview',
    provider: 'openai',
    name: 'GPT-4 Vision Preview',
    contextSize: 4096,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
  },
  // Anthropic models (Claude)
  {
    id: 'claude-2',
    provider: 'anthropic',
    name: 'Claude 2',
    contextSize: 100000,
    supportsStreaming: true,
    supportsTools: false, // Anthropic currently doesn't support tools in the same way
    supportsVision: false,
  },
  {
    id: 'claude-instant-1',
    provider: 'anthropic',
    name: 'Claude Instant',
    contextSize: 100000,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
  },
  // Google Gemini models
  {
    id: 'gemini-pro',
    provider: 'gemini',
    name: 'Gemini Pro',
    contextSize: 32768, // approx
    supportsStreaming: true,
    supportsTools: false, // Gemini API may not support tools yet
    supportsVision: true, // Gemini Pro Vision supports vision
  },
  // Local models (placeholder)
  {
    id: 'local-llama-7b',
    provider: 'local',
    name: 'Local Llama 7B',
    contextSize: 2048,
    supportsStreaming: false,
    supportsTools: false,
    supportsVision: false,
  },
];

export function getModelById(id: string): ModelMetadata | undefined {
  return MODELS.find(m => m.id === id);
}

export function getModelsByProvider(provider: string): ModelMetadata[] {
  return MODELS.filter(m => m.provider === provider);
}

export function getAllModels(): ModelMetadata[] {
  return MODELS;
}