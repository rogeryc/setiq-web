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
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
}
