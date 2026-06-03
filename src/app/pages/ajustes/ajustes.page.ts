import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiTenantDetail } from '../../core/api/types';
import { TenantsService } from '../../core/api/tenants.service';

interface SettingRow {
  label: string;
  sub?: string;
  value?: string;
  control?: 'input' | 'toggle' | 'button' | 'status';
  status?: 'ok' | 'warn' | 'off';
  toggleOn?: boolean;
  buttonLabel?: string;
}

interface SettingCard {
  title: string;
  description?: string;
  rows: SettingRow[];
  future?: boolean;
  footnote?: string;
}

const AI_POLICY_DEFAULTS = {
  tone_empathetic: true,
  auto_reply_faq: false,
  generate_recs: true,
  daily_summary: true,
};

const CHANNEL_LABEL_DEFAULTS = {
  instagram: '',
  facebook: '',
  tiktok: '',
  email: '',
};

@Component({
  selector: 'app-ajustes-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './ajustes.page.html',
  styleUrl: './ajustes.page.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AjustesPage implements OnInit, OnDestroy {
  private readonly tenants = inject(TenantsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  protected readonly tenant = signal<ApiTenantDetail | null>(null);
  protected readonly loadError = signal<string | null>(null);

  /** Dot-path of the field currently being saved. */
  protected readonly saving = signal<string | null>(null);
  /** Last successfully saved field (shows "✓ guardado" briefly). */
  protected readonly savedKey = signal<string | null>(null);
  /** Last save error, if any. */
  protected readonly saveError = signal<string | null>(null);

  // --- Derived values bound to the editable cards ---

  protected readonly kaizenEnabled = computed<boolean>(() => {
    const modules = this.tenant()?.modules as Record<string, { enabled?: boolean }> | undefined;
    return modules?.['kaizen']?.enabled ?? false;
  });

  protected readonly aiPolicy = computed(() => {
    const raw = (this.tenant()?.settings as Record<string, unknown> | undefined)?.['ai_policy'] as
      | Record<string, boolean>
      | undefined;
    return { ...AI_POLICY_DEFAULTS, ...(raw ?? {}) };
  });

  protected readonly channelLabels = computed(() => {
    const raw = (this.tenant()?.settings as Record<string, unknown> | undefined)?.['channel_labels'] as
      | Record<string, string>
      | undefined;
    return { ...CHANNEL_LABEL_DEFAULTS, ...(raw ?? {}) };
  });

  protected readonly aiPolicyRows = [
    { key: 'tone_empathetic', label: 'Tono empático y profesional', sub: 'Aplica al estilo de las respuestas sugeridas.' },
    { key: 'auto_reply_faq',  label: 'Auto-responder consultas frecuentes', sub: 'Sólo después de aprobación humana.' },
    { key: 'generate_recs',   label: 'Generar recomendaciones comerciales', sub: 'Sugerencias de campañas y segmentos.' },
    { key: 'daily_summary',   label: 'Resumen diario por correo', sub: '09:00 La Paz · al admin del tenant.' },
  ] as const;

  protected readonly channelRows = [
    { key: 'instagram', label: 'Instagram', placeholder: '@cuenta' },
    { key: 'facebook',  label: 'Facebook',  placeholder: 'Nombre de la página' },
    { key: 'tiktok',    label: 'TikTok',    placeholder: '@cuenta' },
    { key: 'email',     label: 'Email',     placeholder: 'hola@dominio.bo' },
  ] as const;

  /** Static / future cards — unchanged from before. */
  readonly cards: SettingCard[] = [
    {
      title: 'Identidad',
      description: 'Cómo aparece este inquilino dentro de SETIQ. Para renombrar o cambiar slug, contactanos.',
      rows: [
        { label: 'Nombre comercial', value: 'Thalma', control: 'input' },
        { label: 'Slug del tenant', value: 'thalma', control: 'input' },
        { label: 'País', value: 'Bolivia', control: 'input' },
        { label: 'Zona horaria', value: 'America/La_Paz (UTC-4)', control: 'input' },
        { label: 'Idioma del análisis', value: 'Español (LATAM)', control: 'input' },
      ],
    },
    {
      title: 'Contexto del negocio para IA',
      description: 'Qué tipo de audiencia y temas le importan al inquilino — alimenta cada prompt a Claude.',
      future: true,
      rows: [
        { label: 'Industria', sub: 'Plantilla base de taxonomía', value: 'Periodismo / medios independientes', control: 'input' },
        { label: 'Categorías de audiencia', sub: '5 categorías activas', control: 'button', buttonLabel: 'Editar taxonomía' },
        { label: 'Temas que importan', sub: 'Vivienda, política provincial, suscripciones…', control: 'button', buttonLabel: 'Editar temas' },
        { label: 'Alertas operativas', sub: 'Cluster de quejas, caídas, picos negativos', control: 'button', buttonLabel: 'Configurar' },
      ],
      footnote: 'Bloqueante cuando entre el segundo cliente — ver TODO.md.',
    },
    {
      title: 'Facturación',
      description: 'Pendiente de incorporación de la empresa — sin cargos por ahora.',
      future: true,
      rows: [
        { label: 'Método de pago',  sub: 'No configurado', control: 'button', buttonLabel: 'Agregar' },
        { label: 'Razón social',    sub: 'Sin empresa formada todavía', control: 'button', buttonLabel: 'Configurar' },
        { label: 'Próximo cargo',   sub: 'N/A', control: 'status', status: 'off', value: 'Sin cargo' },
        { label: 'Historial',       sub: '0 facturas emitidas', control: 'button', buttonLabel: 'Ver' },
      ],
      footnote: 'Se activa cuando se incorpora el NIT en FUNDEMPRESA.',
    },
    {
      title: 'Webhooks y API',
      description: 'Cómo recibimos eventos de Meta + endpoints expuestos.',
      future: true,
      rows: [
        { label: 'Verify token (Meta)', sub: 'Handshake de Meta webhooks', control: 'input', value: '••••••••••••••••' },
        { label: 'Webhook URL', sub: 'POST /webhooks/meta', control: 'input', value: 'https://api.setiq.bo/webhooks/meta' },
        { label: 'API token de servicio', sub: 'Para integraciones internas', control: 'button', buttonLabel: 'Generar' },
      ],
    },
    {
      title: 'Privacidad y retención de datos',
      description: 'Cuánto tiempo guardamos cada tipo de dato y quién puede acceder.',
      future: true,
      rows: [
        { label: 'Mensajes y conversaciones', sub: 'Hard-delete por antigüedad configurable', control: 'input', value: 'Sin expiración' },
        { label: 'Webhook logs crudos', sub: 'Para replay/debug', control: 'input', value: '30 días' },
        { label: 'Mentions de Apify', sub: 'Datos públicos', control: 'input', value: '90 días' },
        { label: 'Logs de clasificación de Claude', sub: 'Auditar prompts', control: 'input', value: '90 días' },
      ],
      footnote: 'Bloqueante para cumplir requerimientos del primer cliente con datos sensibles.',
    },
  ];

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      this.tenant.set(await this.tenants.getMe());
    } catch (e) {
      this.loadError.set(e instanceof Error ? e.message : String(e));
    }
  }

  ngOnDestroy(): void {
    for (const t of this.saveTimers.values()) clearTimeout(t);
    this.saveTimers.clear();
  }

  // --- Mutations -----------------------------------------------------

  async toggleKaizen(): Promise<void> {
    const next = !this.kaizenEnabled();
    await this.persist('modules.kaizen', async () => {
      const { modules } = await this.tenants.patchModules({ kaizen: { enabled: next } });
      this.tenant.update((t) => (t ? { ...t, modules } : t));
    });
  }

  async toggleAiPolicy(key: string): Promise<void> {
    const next = !this.aiPolicy()[key as keyof typeof AI_POLICY_DEFAULTS];
    await this.persist(`ai_policy.${key}`, async () => {
      const { settings } = await this.tenants.patchSettings({ ai_policy: { [key]: next } });
      this.tenant.update((t) => (t ? { ...t, settings } : t));
    });
  }

  /** Inputs: optimistic local update, debounced PATCH. */
  onChannelLabelChange(platform: string, value: string): void {
    this.tenant.update((t) => {
      if (!t) return t;
      const current = (t.settings as Record<string, unknown>)['channel_labels'] as Record<string, string> | undefined;
      return {
        ...t,
        settings: {
          ...t.settings,
          channel_labels: { ...(current ?? {}), [platform]: value },
        },
      };
    });

    const key = `channel_labels.${platform}`;
    const existing = this.saveTimers.get(key);
    if (existing) clearTimeout(existing);
    this.saveTimers.set(
      key,
      setTimeout(() => {
        this.persist(key, async () => {
          const { settings } = await this.tenants.patchSettings({
            channel_labels: { [platform]: value },
          });
          this.tenant.update((t) => (t ? { ...t, settings } : t));
        });
      }, 500),
    );
  }

  private async persist(key: string, op: () => Promise<void>): Promise<void> {
    this.saving.set(key);
    this.saveError.set(null);
    try {
      await op();
      this.savedKey.set(key);
      setTimeout(() => {
        if (this.savedKey() === key) this.savedKey.set(null);
      }, 2000);
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : String(e));
    } finally {
      if (this.saving() === key) this.saving.set(null);
    }
  }

  isSaving(key: string): boolean {
    return this.saving() === key;
  }
  isSaved(key: string): boolean {
    return this.savedKey() === key;
  }
}
