import { createClient } from '@supabase/supabase-js'
import type { Lead, Campaign, LeadActivity, EmailTemplate, CampaignStep } from '@/types/lead'

const supabaseUrl = 'https://xvcqdizrsfvfuvvgilgm.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2Y3FkaXpyc2Z2ZnV2dmdpbGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTYyNDgsImV4cCI6MjA5Nzg5MjI0OH0.DpvdkiwlCm7PNomz_djjntmIgg9MmkZtg9acgCgKti4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Leads ────────────────────────────────────────────────────────────────────

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Lead[]
}

export async function updateLeadStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw error
}

export async function createLead(
  fields: {
    first_name: string
    last_name: string
    phone: string
    email: string | null
    channel: string
    service_type: string
    status: string
    property_address: string | null
    city: string | null
    source: string
  },
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...fields,
      lead_score: 50,
      priority: 'Warm',
      ai_confidence_score: 0,
      photos_submitted: false,
      nurture_day: 0,
    })
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, lead_campaigns(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown[]).map((row: unknown) => {
    const r = row as Record<string, unknown>
    const { lead_campaigns: lc, ...rest } = r
    return {
      ...(rest as unknown as Campaign),
      lead_count: ((lc as { count: number }[])?.[0]?.count) ?? 0,
    }
  })
}

export async function createCampaign(
  campaign: Pick<Campaign, 'name' | 'description' | 'color'>,
): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw error
  return data as Campaign
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw error
}

export async function fetchLeadCampaigns(leadId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('lead_campaigns')
    .select('campaign_id, campaigns(*)')
    .eq('lead_id', leadId)
  if (error) throw error
  return ((data ?? []) as unknown[]).map(
    (row: unknown) => (row as Record<string, unknown>).campaigns as Campaign,
  )
}

export async function addLeadToCampaign(leadId: string, campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_campaigns')
    .upsert({ lead_id: leadId, campaign_id: campaignId })
  if (error) throw error
}

export async function removeLeadFromCampaign(leadId: string, campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_campaigns')
    .delete()
    .eq('lead_id', leadId)
    .eq('campaign_id', campaignId)
  if (error) throw error
}

export async function fetchCampaignLeads(campaignId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('lead_campaigns')
    .select('leads(*)')
    .eq('campaign_id', campaignId)
  if (error) throw error
  return ((data ?? []) as unknown[]).map(
    (row: unknown) => (row as Record<string, unknown>).leads as Lead,
  )
}

// ── Activities ───────────────────────────────────────────────────────────────

export async function fetchLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LeadActivity[]
}

export async function fetchAllActivities(limit = 50): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as LeadActivity[]
}

export async function addActivity(
  activity: Omit<LeadActivity, 'id' | 'created_at'>,
): Promise<void> {
  const { error } = await supabase.from('lead_activities').insert(activity)
  if (error) throw error
}

// ── Campaign Steps ────────────────────────────────────────────────────────────

export async function fetchCampaignSteps(campaignId: string): Promise<CampaignStep[]> {
  const { data, error } = await supabase
    .from('campaign_steps')
    .select('*, template:email_templates(*)')
    .eq('campaign_id', campaignId)
    .order('step_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as CampaignStep[]
}

export async function saveCampaignSteps(
  campaignId: string,
  steps: Omit<CampaignStep, 'id' | 'created_at' | 'updated_at' | 'template'>[],
): Promise<void> {
  await supabase.from('campaign_steps').delete().eq('campaign_id', campaignId)
  if (steps.length === 0) return
  const { error } = await supabase.from('campaign_steps').insert(
    steps.map((s) => ({ ...s, campaign_id: campaignId })),
  )
  if (error) throw error
}

export async function updateCampaignN8n(
  campaignId: string,
  n8n_workflow_id: string,
  n8n_workflow_url: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update({ n8n_workflow_id, n8n_workflow_url })
    .eq('id', campaignId)
  if (error) throw error
}

export async function fetchCampaignLeadIds(campaignId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('lead_campaigns')
    .select('lead_id')
    .eq('campaign_id', campaignId)
  if (error) throw error
  return (data ?? []).map((r: { lead_id: string }) => r.lead_id)
}

// ── Email Templates ──────────────────────────────────────────────────────────

export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as EmailTemplate[]
}

export async function updateEmailTemplate(
  id: string,
  fields: { name: string; description: string | null; subject: string; html_body: string },
): Promise<void> {
  const { error } = await supabase.from('email_templates').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) throw error
}

export async function createEmailTemplate(
  fields: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>,
): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .insert(fields)
    .select()
    .single()
  if (error) throw error
  return data as EmailTemplate
}
