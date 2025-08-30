import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], files = [] } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('ChatGPT_API');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: `You are Amble, a helpful AI assistant for a file sharing and conversion platform. You help users with:
        - File upload and sharing questions
        - File format conversion guidance
        - General file management advice
        - Platform navigation help
        
        Be friendly, concise, and helpful. Always introduce yourself as Amble when starting a new conversation.`
      },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with messages:', messages.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('OpenAI response received');

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// supabase/functions/ai-chat/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// IMPORTANT: set this in your Supabase project environment
// e.g. in dashboard > Edge Functions > ai-chat > Environment Variables
// key: OPENAI_API_KEY, value: your actual key
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400 }
      );
    }

    // Call OpenAI Chat API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or gpt-4, gpt-3.5, etc.
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
