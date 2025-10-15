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
    const { message, context } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Siz FarmTrade platformasining AI yordamchisisiz. Siz fermerlarga qishloq xo'jaligi, mahsulot sotish, narxlar, bog'bonchilik va fermerchilik bo'yicha yordam berasiz. 
            
            O'zbek tilida javob bering va professional, lekin do'stona ohangda bo'ling. Quyidagi sohalarda yordam bera olasiz:
            - Ekin yetishtirish va parvarish qilish
            - Mahsulot narxlarini belgilash strategiyasi
            - Bozor tendentsiyalari
            - Organik fermerchilik
            - Hasharotlar va kasalliklar bilan kurashish
            - Sug'orish va o'g'itlash
            - Savdo-sotiq maslahatlari`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI Gateway error:', errorData);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Kechirasiz, javob berish imkoni bo\'lmadi.';

    console.log('AI assistant response generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: aiMessage,
        usage: data.usage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in AI farm assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});