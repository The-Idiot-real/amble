// Simple AI chat service for direct Groq API calls
export const chatWithAI = async (message: string): Promise<string> => {
  const apiKey = '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';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for a file management platform called Amble. Be concise and friendly.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response available';
    
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
};
