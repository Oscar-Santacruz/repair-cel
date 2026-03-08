-- 1. Create organizations (multi-tenant)
CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create users/technicians mapping (optional but good for auditing)
CREATE TABLE public.organization_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'technician' NOT NULL, -- 'owner', 'technician', 'receptionist'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create clients
CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    full_name text NOT NULL,
    document text,
    phone text,
    email text,
    address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create stock (refacciones)
CREATE TABLE public.stock (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    quantity integer DEFAULT 0 NOT NULL,
    min_quantity integer DEFAULT 5 NOT NULL,
    serial_number text, -- Only if it is a unique serialized part
    price numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create reparations (Tickets)
CREATE TABLE public.reparations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    ticket_number text NOT NULL, -- e.g. TCK-001
    client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
    received_by uuid REFERENCES auth.users(id), -- Auditoria de quien recibio
    assigned_technician_id uuid REFERENCES auth.users(id),
    
    device_brand text NOT NULL,
    device_model text NOT NULL,
    imei_or_serial text,
    
    aesthetic_condition text, -- text description
    
    -- Checklists (jsonb to allow dynamic keys like { "wifi": true, "camera_front": false })
    entry_checklist jsonb DEFAULT '{}'::jsonb,
    exit_checklist jsonb DEFAULT '{}'::jsonb,
    
    status text DEFAULT 'RECEIVED' NOT NULL, -- RECEIVED, IN_REVIEW, DOING, READY, DELIVERED
    budget numeric(12,2),
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Reparation Evidence (Photos)
CREATE TABLE public.reparation_evidence (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reparation_id uuid REFERENCES public.reparations(id) ON DELETE CASCADE NOT NULL,
    photo_url text NOT NULL,
    description text,
    type text DEFAULT 'ENTRY' NOT NULL, -- ENTRY, PROGRESS, EXIT
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Used Parts (Refacciones usadas en reparación)
CREATE TABLE public.reparation_parts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reparation_id uuid REFERENCES public.reparations(id) ON DELETE CASCADE NOT NULL,
    stock_id uuid REFERENCES public.stock(id) ON DELETE RESTRICT NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price numeric(12,2) NOT NULL, -- price at the moment of using
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Sales / Financing
CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
    reparation_id uuid REFERENCES public.reparations(id) ON DELETE SET NULL,
    
    total_amount numeric(12,2) NOT NULL,
    initial_payment numeric(12,2) DEFAULT 0,
    financed_amount numeric(12,2) DEFAULT 0,
    
    payment_status text DEFAULT 'PENDING' NOT NULL, -- PENDING, PARTIAL, COMPLETED
    created_by uuid REFERENCES auth.users(id),
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Support Functions & Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reparations_updated_at BEFORE UPDATE ON public.reparations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reparation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reparation_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Basic Policies (can be improved later)
-- Organizations: visible if the user is linked
CREATE POLICY "Users can view their orgs" ON public.organizations 
FOR SELECT USING (
  id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
  OR 
  (auth.uid() IS NOT NULL) -- If we want global initial access or if the admin sets it up
);
