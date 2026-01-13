
-- =============================================
-- FAZA 2: PRIVATE COMMUNICATION HUB
-- =============================================

-- 1. CHAT ROOMS TABLE
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'order', 'support')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_order ON chat_rooms(order_id) WHERE order_id IS NOT NULL;

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- 2. CHAT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON chat_participants(room_id);

ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- 3. PRIVATE MESSAGES TABLE
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
  attachment_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_private_messages_room ON private_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created ON private_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);

ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for private messages
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;

-- 4. RLS POLICIES FOR CHAT

-- Chat rooms: participants can view their rooms
CREATE POLICY "Participants can view their rooms" ON chat_rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = chat_rooms.id AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Chat rooms: authenticated users can create rooms
CREATE POLICY "Users can create chat rooms" ON chat_rooms
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Chat participants: users can view participants in their rooms
CREATE POLICY "View participants in own rooms" ON chat_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Chat participants: users can add themselves or others to rooms they created
CREATE POLICY "Add participants to rooms" ON chat_participants
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Chat participants: users can update their own participation
CREATE POLICY "Update own participation" ON chat_participants
FOR UPDATE USING (user_id = auth.uid());

-- Private messages: participants can view messages in their rooms
CREATE POLICY "Participants can view messages" ON private_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = private_messages.room_id AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Private messages: participants can send messages
CREATE POLICY "Participants can send messages" ON private_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = private_messages.room_id AND user_id = auth.uid()
  )
);

-- Private messages: users can edit/delete their own messages (soft delete)
CREATE POLICY "Users can edit own messages" ON private_messages
FOR UPDATE USING (sender_id = auth.uid());

-- 5. HELPER FUNCTION TO CREATE DIRECT CHAT
CREATE OR REPLACE FUNCTION create_or_get_direct_chat(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_current_user UUID;
BEGIN
  v_current_user := auth.uid();
  
  -- Check if direct chat already exists
  SELECT cr.id INTO v_room_id
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
    AND EXISTS (SELECT 1 FROM chat_participants WHERE room_id = cr.id AND user_id = v_current_user)
    AND EXISTS (SELECT 1 FROM chat_participants WHERE room_id = cr.id AND user_id = other_user_id)
    AND (SELECT COUNT(*) FROM chat_participants WHERE room_id = cr.id) = 2;
  
  IF v_room_id IS NOT NULL THEN
    RETURN v_room_id;
  END IF;
  
  -- Create new room
  INSERT INTO chat_rooms (type) VALUES ('direct') RETURNING id INTO v_room_id;
  
  -- Add participants
  INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, v_current_user);
  INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, other_user_id);
  
  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. HELPER FUNCTION TO CREATE ORDER CHAT
CREATE OR REPLACE FUNCTION create_order_chat(p_order_id UUID)
RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_buyer_id UUID;
  v_seller_id UUID;
BEGIN
  -- Get order participants
  SELECT o.buyer_id, p.seller_id INTO v_buyer_id, v_seller_id
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.id = p_order_id;
  
  -- Check if order chat already exists
  SELECT id INTO v_room_id FROM chat_rooms WHERE order_id = p_order_id AND type = 'order';
  
  IF v_room_id IS NOT NULL THEN
    RETURN v_room_id;
  END IF;
  
  -- Create new room
  INSERT INTO chat_rooms (type, order_id) VALUES ('order', p_order_id) RETURNING id INTO v_room_id;
  
  -- Add participants
  INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, v_buyer_id);
  INSERT INTO chat_participants (room_id, user_id) VALUES (v_room_id, v_seller_id);
  
  -- Add system message
  INSERT INTO private_messages (room_id, sender_id, content, content_type)
  VALUES (v_room_id, v_buyer_id, 'Buyurtma bo''yicha suhbat boshlandi', 'system');
  
  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
