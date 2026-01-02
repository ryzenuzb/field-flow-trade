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
    const { message, image } = await req.json();

    if (!message && !image) {
      throw new Error('Message or image is required');
    }

    console.log('Processing request:', { hasMessage: !!message, hasImage: !!image });

    // Build the user content based on whether there's an image
    let userContent: any;
    
    if (image) {
      // For image analysis - use multimodal content
      userContent = [
        {
          type: "text",
          text: message || "Bu rasmda ko'rsatilgan o'simlikni tahlil qiling. Agar kasallik bo'lsa, uni aniqlang va davolash usullarini ayting."
        },
        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ];
    } else {
      userContent = message;
    }

    const systemPrompt = image 
      ? `Siz FarmTrade platformasining professional AI yordamchisisiz va o'simlik kasalliklari bo'yicha mutaxassisiz.

SIZNING VAZIFALARINGIZ:
- Rasmda ko'rsatilgan o'simlikni aniqlash
- O'simlikda kasallik yoki zararkunanda borligini aniqlash
- Kasallikning nomini va belgilarini tavsiflash
- Davolash usullarini batafsil tushuntirish
- Oldini olish choralari va tavsiyalar berish

JAVOB BERISH TARTIBI:
1. 🌱 O'SIMLIK: Rasmda qanday o'simlik ko'rsatilganini ayting
2. 🔍 TAHLIL: O'simlikning umumiy holatini baholang
3. ⚠️ MUAMMO (agar bo'lsa): Kasallik yoki zararkunanda bormi, nomi va belgilari
4. 💊 DAVOLASH: Aniq va qadamma-qadam davolash usullari
5. 🛡️ OLDINI OLISH: Kelajakda bunday muammolarni oldini olish choralari
6. 📋 QO'SHIMCHA MASLAHATLAR: Boshqa foydali tavsiyalar

Har doim o'zbek tilida, tushunarli va amaliy javob bering. Kimyoviy preparatlar nomlarini va dozalarini aniq ko'rsating.`
      : `Siz FarmTrade platformasining professional AI yordamchisisiz. Siz fermerlar, bog'bonlar va qishloq xo'jaligi bilan shug'ullanuvchilar uchun eng yaxshi maslahatchi va mutaxassisiz.

SIZNING VAZIFALARINGIZ:
- Qishloq xo'jaligi, fermerchilik va bog'bonchilik bo'yicha chuqur va professional bilim berish
- Ekinlarni yetishtirish, parvarish qilish va saqlash bo'yicha aniq, amaliy maslahatlar
- Mahsulot narxlarini belgilash va savdo strategiyalari
- Bozor tendentsiyalari va raqobat tahlili
- Organik va zamonaviy fermerchilik usullari
- Hasharotlar, kasalliklar va zararkunandalar bilan kurashish yo'llari
- Sug'orish tizimlari va suv tejash usullari
- O'g'itlar va tuproq sifatini yaxshilash
- Hosilni yig'ish va saqlash texnologiyalari
- Savdo-sotiq va marketing maslahatlari
- Moliyaviy rejalashtirish va daromadni oshirish

JAVOB BERISH QOIDALARI:
1. Har doim o'zbek tilida professional va tushunarli javob bering
2. Aniq raqamlar, foizlar va faktlar bilan qo'llab-quvvatlang
3. Amaliy maslahatlar va qadamma-qadam yo'riqnomalar bering
4. Ilmiy asoslangan ma'lumotlar va tajribaga tayanib javob bering
5. Fermer uchun foydali va to'g'ridan-to'g'ri qo'llanilishi mumkin bo'lgan maslahatlar bering
6. Savol noaniq bo'lsa, aniqlashtiruvchi savollar bering
7. Mahalliy (O'zbekiston) sharoitlariga moslashtirilgan maslahatlar bering

Har doim do'stona, professional va yordam berishga tayyor bo'ling!`;

    // Call Lovable AI Gateway with vision-capable model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Vision-capable model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI Gateway error:', response.status, errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Tizim hozir band, iltimos keyinroq urinib ko'ring" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI xizmati hozir mavjud emas" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Kechirasiz, javob berish imkoni bo\'lmadi.';

    console.log('AI assistant response generated successfully', { hasImage: !!image });

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