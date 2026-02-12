
-- Soil inspection requests from farmers
CREATE TABLE public.soil_inspection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  location_name TEXT,
  land_size NUMERIC NOT NULL,
  land_size_unit TEXT NOT NULL DEFAULT 'gektar',
  previous_crops TEXT[],
  contact_phone TEXT,
  contact_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  visited_at TIMESTAMP WITH TIME ZONE,
  visited_by UUID,
  visit_notes TEXT,
  needs_analysis BOOLEAN,
  analysis_price NUMERIC,
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.soil_inspection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can create inspection requests"
ON public.soil_inspection_requests FOR INSERT
WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers can view own requests"
ON public.soil_inspection_requests FOR SELECT
USING (farmer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sub_admin'::app_role));

CREATE POLICY "Admins can update requests"
ON public.soil_inspection_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sub_admin'::app_role));

-- Soil analysis results
CREATE TABLE public.soil_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.soil_inspection_requests(id) ON DELETE CASCADE,
  fertility_score INTEGER CHECK (fertility_score >= 0 AND fertility_score <= 100),
  soil_type TEXT,
  ph_level NUMERIC,
  moisture_level NUMERIC,
  nitrogen_level TEXT,
  phosphorus_level TEXT,
  potassium_level TEXT,
  crop_recommendations TEXT[],
  fertilizer_suggestions TEXT[],
  additional_notes TEXT,
  analyzed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.soil_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own analysis results"
ON public.soil_analysis_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.soil_inspection_requests
    WHERE soil_inspection_requests.id = soil_analysis_results.request_id
    AND (soil_inspection_requests.farmer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sub_admin'::app_role))
  )
);

CREATE POLICY "Admins can insert analysis results"
ON public.soil_analysis_results FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sub_admin'::app_role));

CREATE POLICY "Admins can update analysis results"
ON public.soil_analysis_results FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sub_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_soil_inspection_requests_updated_at
BEFORE UPDATE ON public.soil_inspection_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_soil_analysis_results_updated_at
BEFORE UPDATE ON public.soil_analysis_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
