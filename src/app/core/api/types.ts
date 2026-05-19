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
  unit: string | null;
  delta: ApiKpiDelta | null;
  sub: string | null;
  spark: number[] | null;
  spark_tone: ApiTone | null;
}

export interface ApiChannelSlice {
  key: string;
  label: string;
  value: number;
}

export interface ApiInsightAction {
  label: string;
  route: string | null;
  variant: 'acc' | 'ghost' | null;
}

export interface ApiLeadCopy {
  title: string;
  title_em: string | null;
  body: string;
}

export interface ApiFeaturedRec {
  title: string;
  title_em: string | null;
  title_tail: string | null;
  body: string;
  confidence: string | null;
  age: string | null;
  impact: string | null;
  actions: ApiInsightAction[];
}

export interface ApiMemo {
  severity: 'low' | 'med' | 'high';
  tag: string;
  confidence: string | null;
  title: string;
  title_em: string | null;
  body: string;
  actions: ApiInsightAction[];
  footnote: string | null;
}

export interface ApiOverviewResponse {
  kpis: ApiKpi[];
  channel_distribution: ApiChannelSlice[];
  channel_total: number;
  top_growth_channel: string | null;
  lead: ApiLeadCopy | null;
  featured_recommendation: ApiFeaturedRec | null;
  memos: ApiMemo[];
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
}
