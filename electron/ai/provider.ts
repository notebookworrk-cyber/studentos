// Provider interface for AI models
export interface ProviderOptions {
  apiKey: string;
  // Additional provider-specific options can be added here
}

export interface GenerateTextOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  // Other common parameters
}

export interface GenerateTextResult {
  text: string;
  // Additional metadata if needed
}

export interface StreamTextOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  // Other common parameters
}

// We'll define a callback for streaming
export type StreamTextCallback = (chunk: string, done: boolean) => void;

export abstract class AIProvider {
  constructor(protected options: ProviderOptions) {}

  // Generate text (non-streaming)
  abstract generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;

  // Generate text with streaming
  abstract streamText(options: StreamTextOptions, callback: StreamTextCallback): Promise<void>;

  // Optional: check if the provider is available/configured
  abstract isAvailable(): boolean;

  // Optional: get provider name
  abstract getProviderName(): string;
}

// Example: We'll implement concrete providers below
// For now, we'll leave them as abstract and implement in separate files or same file.

// We can also create a factory function to create providers based on a string.
export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'local';

export function createProvider(name: ProviderName, options: ProviderOptions): AIProvider {
  switch (name) {
    case 'openai':
      return new OpenAIProvider(options);
    case 'anthropic':
      return new AnthropicProvider(options);
    case 'gemini':
      return new GeminiProvider(options);
    case 'local':
      return new LocalProvider(options);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

// Now we need to implement each provider. We'll do them in the same file for simplicity,
// but in a real project we might split them.

// OpenAI Provider
import { OpenAI } from 'openai';

class OpenAIProvider extends AIProvider {
  private openAI: OpenAI;

  constructor(options: ProviderOptions) {
    super(options);
    this.openAI = new OpenAI({ apiKey: options.apiKey });
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const completion = await this.openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: options.prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 256,
    });
    return { text: completion.choices[0]?.message?.content ?? '' };
  }

  async streamText(options: StreamTextOptions, callback: StreamTextCallback): Promise<void> {
    // For simplicity, we'll not implement streaming for OpenAI in this example.
    // In a real implementation, we would use the streaming API.
    const result = await this.generateText(options);
    callback(result.text, true);
  }

  isAvailable(): boolean {
    return !!this.options.apiKey;
  }

  getProviderName(): string {
    return 'openai';
  }
}

// Anthropic Provider (Claude)
import { Anthropic } from '@anthropic-ai/sdk';

class AnthropicProvider extends AIProvider {
  private anthropic: Anthropic;

  constructor(options: ProviderOptions) {
    super(options);
    this.anthropic = new Anthropic({ apiKey: options.apiKey });
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const msg = await this.anthropic.completions.create({
      prompt: options.prompt,
      model: 'claude-2', // or the latest available
      max_tokens_to_sample: options.maxTokens ?? 256,
      temperature: options.temperature ?? 0.7,
    });
    return { text: msg.completion ?? '' };
  }

  async streamText(options: StreamTextOptions, callback: StreamTextCallback): Promise<void> {
    // Streaming not implemented for brevity
    const result = await this.generateText(options);
    callback(result.text, true);
  }

  isAvailable(): boolean {
    return !!this.options.apiKey;
  }

  getProviderName(): string {
    return 'anthropic';
  }
}

// Gemini Provider
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiProvider extends AIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(options: ProviderOptions) {
    super(options);
    this.genAI = new GoogleGenerativeAI(options.apiKey);
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    // For Gemini, we use the generateContent method
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(options.prompt);
    const text = await result.response.text();
    return { text };
  }

  async streamText(options: StreamTextOptions, callback: StreamTextCallback): Promise<void> {
    // Streaming not implemented for brevity
    const result = await this.generateText(options);
    callback(result.text, true);
  }

  isAvailable(): boolean {
    return !!this.options.apiKey;
  }

  getProviderName(): string {
    return 'gemini';
  }
}

// Local Provider (placeholder for local models like Llama.cpp, etc.)
class LocalProvider extends AIProvider {
  constructor(options: ProviderOptions) {
    super(options);
    // In a real implementation, we would initialize a local model here.
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    // Placeholder: return a dummy response
    return { text: `[Local model] Response to: ${options.prompt.substring(0, 50)}...` };
  }

  async streamText(options: StreamTextOptions, callback: StreamTextCallback): Promise<void> {
    // Placeholder streaming
    const result = await this.generateText(options);
    callback(result.text, true);
  }

  isAvailable(): boolean {
    // Assume local provider is always available if we want to allow it without API key
    return true; // or check if a local model is loaded
  }

  getProviderName(): string {
    return 'local';
  }
}

// Export the concrete providers for use in other modules if needed
export { OpenAIProvider, AnthropicProvider, GeminiProvider, LocalProvider };