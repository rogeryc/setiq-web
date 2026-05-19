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

export interface ApiOverviewResponse {
  kpis: ApiKpi[];
  channel_distribution: ApiChannelSlice[];
  channel_total: number;
  top_growth_channel: string | null;
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
}
