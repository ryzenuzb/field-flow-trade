-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Anyone can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Create index for better performance
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;