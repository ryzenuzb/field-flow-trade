-- Create crop_events table
CREATE TABLE public.crop_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('planting', 'harvest')),
  crop_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crop_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own crop events" 
ON public.crop_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own crop events" 
ON public.crop_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crop events" 
ON public.crop_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crop events" 
ON public.crop_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_crop_events_updated_at
BEFORE UPDATE ON public.crop_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();