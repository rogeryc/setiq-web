// Response shapes for the SETIQ API. Track schemas in
// setiq-api/src/setiq/<module>/schemas.py. Manual sync for now;
// generate from the OpenAPI spec when the surface grows.

export type ApiTone = 'pos' | 'neg' | 'warn' | 'neutral';

export interface ApiKpiDelta {
  label: string;
  tone: ApiTone;
}

export interface ApiKpi {
  label: string;
  value: string;
  unit?: string;
  delta?: ApiKpiDelta;
  sub?: string;
  spark?: number[];
  spark_tone?: ApiTone;
}

export interface ApiChannelSlice {
  key: string;
  label: string;
  value: number;
}

export interface ApiInsightAction {
  label: string;
  route?: string;
  variant?: 'acc' | 'ghost';
}

export interface ApiLeadCopy {
  title: string;
  title_em?: string;
  body: string;
}

export interface ApiFeaturedRec {
  title: string;
  title_em?: string;
  title_tail?: string;
  body: string;
  confidence?: string;
  age?: string;
  impact?: string;
  actions: ApiInsightAction[];
}

export interface ApiMemo {
  severity: 'low' | 'med' | 'high';
  tag: string;
  confidence?: string;
  title: string;
  title_em?: string;
  body: string;
  actions: ApiInsightAction[];
  footnote?: string;
}

export interface ApiOverviewResponse {
  kpis: ApiKpi[];
  channel_distribution: ApiChannelSlice[];
  channel_total: number;
  top_growth_channel?: string;
  lead?: ApiLeadCopy;
  featured_recommendation?: ApiFeaturedRec;
  memos: ApiMemo[];
  generated_at: string;  // ISO 8601
}

export interface ApiCompetitorActivity {
  id: string;
  label: string;
  mentions: number;
  previous: number;
  delta: number;
  sentiment_score?: number;
}

export interface ApiCompetitorActivityResponse {
  period_days: number;
  competitors: ApiCompetitorActivity[];
  generated_at: string;
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
}

export interface ApiTenantInfo {
  id: string;
  slug: string;
  name: string;
  modules: Record<string, unknown>;
}

export interface ApiUserMe {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: 'admin' | 'agent' | 'viewer';
  tenant: ApiTenantInfo;
}

export type GroupBy = 'intent' | 'channel' | 'sentiment' | 'thread';

export interface ApiConversationSummary {
  id: string;
  contact_name?: string;
  contact_handle: string;
  channel: string;
  last_message_at?: string;
  last_message_preview?: string;
  message_count: number;
  status: string;
  subject?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  /** Set only when the row aggregates a whole thread (group_by=thread). */
  participant_count?: number;
}

export interface ApiConversationGroup {
  key: string;
  label: string;
  count: number;
  conversations: ApiConversationSummary[];
}

export interface ApiConversationsResponse {
  group_by: GroupBy;
  total: number;
  groups: ApiConversationGroup[];
}

export interface ApiMessageDetail {
  id: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'contact' | 'agent' | 'ai' | 'system';
  content_type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'template';
  content_text?: string;
  sent_at: string;
  sentiment?: string;
  intent?: string;
  /** Set when the detail spans multiple contacts (thread view). */
  sender_name?: string;
  sender_handle?: string;
}

export interface ApiConversationDetail {
  id: string;
  contact_name?: string;
  contact_handle: string;
  channel: string;
  status: string;
  subject?: string;
  created_at: string;
  last_message_at?: string;
  sentiment?: string;
  intent?: string;
  priority?: string;
  messages: ApiMessageDetail[];
  is_thread?: boolean;
  participant_count?: number;
}

export interface ApiModuleToggles {
  setiq: boolean;
  kaizen: boolean;
}

export type ChannelKey = 'instagram' | 'facebook' | 'tiktok' | 'email' | 'whatsapp' | 'phone';

export interface ApiChannelStatus {
  key: ChannelKey;
  label: string;
  connected: boolean;
  account_label?: string;
  status: 'active' | 'warning' | 'disconnected';
  last_sync_at?: string;
  modules: ApiModuleToggles;
  warning?: string;
}

export interface ApiChannelsResponse {
  channels: ApiChannelStatus[];
  connected_count: number;
  warning_count: number;
}

export type SubjectKind = 'competitor' | 'brand' | 'keyword' | 'hashtag';

export type InsightKind = 'lead' | 'featured' | 'memo';

export interface ApiInsight {
  id: string;
  kind: InsightKind;
  severity?: 'low' | 'med' | 'high';
  tag?: string;
  title: string;
  title_em?: string;
  title_tail?: string;
  body: string;
  confidence?: string;
  age?: string;
  impact?: string;
  footnote?: string;
  actions: ApiInsightAction[];
  rank: number;
  created_at: string;
}

export interface ApiInsightsResponse {
  insights: ApiInsight[];
  total: number;
  counts: Partial<Record<InsightKind, number>>;
}

export type TeamRole = 'admin' | 'agent' | 'viewer';

export interface ApiTeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  initials: string;
  joined_at: string;
  last_login_at?: string;
  is_superadmin: boolean;
}

export interface ApiTeamResponse {
  members: ApiTeamMember[];
  count_by_role: Partial<Record<TeamRole, number>>;
  total: number;
}

export interface ApiTrackedSubject {
  id: string;
  kind: SubjectKind;
  label: string;
  handles: Record<string, string>;   // { instagram: "@foo", tiktok: "@foo.tt", ... }
  keywords: string[];
  hashtags: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
  mention_count: number;
  last_mention_at?: string;
}

export interface ApiTrackedSubjectCreate {
  kind: SubjectKind;
  label: string;
  handles?: Record<string, string>;
  keywords?: string[];
  hashtags?: string[];
  enabled?: boolean;
}

export interface ApiTrackedSubjectUpdate {
  label?: string;
  handles?: Record<string, string>;
  keywords?: string[];
  hashtags?: string[];
  enabled?: boolean;
}

export interface ApiMentionPreview {
  id: string;
  platform: string;
  author_display_name?: string;
  author_handle?: string;
  content_text?: string;
  content_url?: string;
  published_at?: string;
  sentiment?: string;
}

export interface ApiSentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ApiOverlapContact {
  id: string;
  display_name?: string;
}

export interface ApiTrackedSubjectDetail {
  id: string;
  kind: SubjectKind;
  label: string;
  mention_count: number;
  sentiment_breakdown: ApiSentimentBreakdown;
  recent_mentions: ApiMentionPreview[];
  audience_overlap: ApiOverlapContact[];
}
