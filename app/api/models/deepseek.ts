import { Message } from '@/types/chat';

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
}

export async function getDeepseekResponse(messages: Message[]) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
  }

  // Format messages for OpenRouter API
  const formattedMessages = messages.map(({ role, content }) => ({
    role,
    content,
  }));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'DeFi Copilot',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-zero:free',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as OpenRouterResponse;
    
    return {
      id: data.id,
      model: data.model,
      message: data.choices[0].message,
      finish_reason: data.choices[0].finish_reason,
    };
  } catch (error) {
    console.error('Error calling Deepseek model:', error);
    throw error;
  }
}