import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageRequest {
  room_id?: string;
  other_user_id?: string; // For creating direct chat
  order_id?: string; // For creating order chat
  content: string;
  content_type?: 'text' | 'image' | 'file';
  attachment_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Rate limit: 30 messages per minute
    const { data: canProceed } = await serviceClient.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'send_message',
      p_max_requests: 30,
      p_window_seconds: 60
    });

    if (!canProceed) {
      return new Response(
        JSON.stringify({ success: false, error: "Juda ko'p xabar. Biroz kuting." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const body: MessageRequest = await req.json();

    // Validate content
    if (!body.content || body.content.trim().length === 0) {
      throw new Error("Xabar bo'sh bo'lmasligi kerak");
    }

    if (body.content.length > 5000) {
      throw new Error("Xabar juda uzun (max 5000 belgi)");
    }

    let roomId = body.room_id;

    // Create direct chat if needed
    if (!roomId && body.other_user_id) {
      const { data: newRoomId, error: chatError } = await serviceClient.rpc(
        'create_or_get_direct_chat',
        { other_user_id: body.other_user_id }
      );
      
      if (chatError) throw chatError;
      roomId = newRoomId;
    }

    // Create order chat if needed
    if (!roomId && body.order_id) {
      const { data: newRoomId, error: chatError } = await serviceClient.rpc(
        'create_order_chat',
        { p_order_id: body.order_id }
      );
      
      if (chatError) throw chatError;
      roomId = newRoomId;
    }

    if (!roomId) {
      throw new Error("room_id, other_user_id yoki order_id kerak");
    }

    // Verify user is participant
    const { data: participant, error: participantError } = await supabaseClient
      .from('chat_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      throw new Error("Bu suhbatda ishtirok etmaysiz");
    }

    // Insert message
    const { data: message, error: messageError } = await supabaseClient
      .from('private_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content: body.content.trim(),
        content_type: body.content_type || 'text',
        attachment_url: body.attachment_url
      })
      .select(`
        *,
        profiles:sender_id (full_name)
      `)
      .single();

    if (messageError) throw messageError;

    // Update room's updated_at
    await serviceClient
      .from('chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', roomId);

    // Update sender's last_read_at
    await supabaseClient
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: message.id,
          room_id: message.room_id,
          content: message.content,
          content_type: message.content_type,
          sender_name: message.profiles?.full_name,
          created_at: message.created_at
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error("Message error:", error);
    const message = error instanceof Error ? error.message : "Xabar yuborishda xatolik";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
