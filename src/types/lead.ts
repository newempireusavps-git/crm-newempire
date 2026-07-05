// Pipeline stages — match what n8n saves to leads.status
export const PIPELINE_STAGES = [
  { status: 'New Lead',        label: 'Novo Lead',         color: 'border-t-blue-500' },
  { status: 'Qualificando',    label: 'Qualificando',      color: 'border-t-purple-500' },
  { status: 'Analise por Foto',label: 'Análise por Foto',  color: 'border-t-yellow-500' },
  { status: 'Agendamento',     label: 'Agendamento',       color: 'border-t-orange-500' },
  { status: 'Nutricao',        label: 'Nutrição',          color: 'border-t-pink-500' },
  { status: 'Followup',        label: 'Followup',          color: 'border-t-cyan-500' },
] as const

export type LeadStatus = (typeof PIPELINE_STAGES)[number]['status']

// Must match the leads_service_type_check constraint in Supabase
export const SERVICE_TYPES = [
  'Cabinet Painting',
  'Cabinet Refacing',
  'Cabinet Replacement',
  'Kitchen Remodeling',
  'Bathroom Remodeling',
  'Flooring',
  'Interior Painting',
  'Exterior Painting',
  'Drywall Repair',
  'Home Additions',
  'New Construction',
  'Commercial Remodeling',
  'Design-Build',
  'General Contracting',
  'Unknown',
]

// Must match the leads_source_check constraint in Supabase
export const VALID_SOURCES = ['Website', 'Facebook', 'Instagram', 'Google', 'WhatsApp', 'Referral', 'Other']

export const VALID_CHANNELS = ['manual', 'whatsapp', 'instagram', 'facebook', 'chat', 'sms', 'referral', 'website']

// Must match the leads_priority_check constraint in Supabase
export const PRIORITY_LEVELS = ['Cold', 'Warm', 'Hot', 'Very Hot']

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  property_address: string | null
  city: string | null
  zip_code: string | null
  source: string
  service_type: string
  timeline: string | null
  lead_score: number
  priority: string        // 'Hot' | 'Warm' | 'Cold'
  status: string          // pipeline stage
  estimated_project_value: number | null
  photos_submitted: boolean
  assigned_sales_rep: string | null
  ai_confidence_score: number
  last_contact_at: string | null
  next_followup_at: string | null
  nurture_day: number
  ai_analysis_summary: string | null
  session_id: string | null
  channel: string
  facebook_psid: string | null
  instagram_scoped_id: string | null
}

export interface Campaign {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  is_active: boolean
  color: string
  lead_count?: number
  n8n_workflow_id?: string | null
  n8n_workflow_url?: string | null
  steps?: CampaignStep[]
}

export interface LeadActivity {
  id: string
  created_at: string
  lead_id: string
  type: 'email' | 'chat' | 'followup' | 'note' | 'status_change' | 'campaign'
  title: string
  description: string | null
  metadata: Record<string, unknown>
}

export type CampaignChannel = 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'sms'

export interface CampaignStep {
  id: string
  created_at: string
  updated_at: string
  campaign_id: string
  step_order: number
  channel: CampaignChannel
  template_id: string | null
  delay_days: number
  template?: EmailTemplate
}

export interface EmailTemplate {
  id: string
  created_at: string
  updated_at: string
  template_key: string
  name: string
  description: string | null
  subject: string
  html_body: string
  body_text: string | null
  image_url: string | null
  is_active: boolean
  channel: CampaignChannel
}

export type FilterPeriodo = 'hoje' | 'semana' | 'mes' | 'todos'

export interface Filters {
  periodo: FilterPeriodo
  status: string
  channel: string
}
