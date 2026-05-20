import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  future?: boolean;        // dim + add "Próximamente" badge
  footnote?: string;
}

@Component({
  selector: 'app-ajustes-page',
  imports: [RouterLink],
  templateUrl: './ajustes.page.html',
  styleUrl: './ajustes.page.scss',
  // The admin shell + card classes come from setiq.css; we add a bit of
  // page-local styling. Disable encapsulation so the global selectors work
  // alongside our scoped tweaks.
  encapsulation: ViewEncapsulation.None,
})
export class AjustesPage {
  /**
   * Static configuration cards. Each card maps to a future settings section.
   * Today nothing persists; the page is a visual map of what we'll wire up.
   */
  readonly cards: SettingCard[] = [
    {
      title: 'Plan y módulos',
      description: 'SETIQ Core + Kaizen · facturación mensual',
      rows: [
        {
          label: 'SETIQ Core',
          sub: 'Dashboards, recomendaciones, segmentos',
          control: 'status', status: 'ok', value: 'Activo',
        },
        {
          label: 'Kaizen Inbox',
          sub: 'Inbox unificado de comentarios y DMs (sólo lectura por ahora)',
          control: 'status', status: 'ok', value: 'Activo',
        },
        {
          label: 'Voice 0800',
          sub: 'Transcripción y análisis de llamadas — disponible para ITALSA',
          control: 'button', buttonLabel: 'Solicitar',
        },
        {
          label: 'Off-property monitoring (Apify)',
          sub: 'Menciones públicas + posts de competidores',
          control: 'status', status: 'warn', value: 'Sin saldo',
        },
      ],
      footnote: 'Los precios definitivos se setean cuando se incorpore la empresa.',
    },
    {
      title: 'Identidad',
      description: 'Cómo aparece este inquilino dentro de SETIQ.',
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
        {
          label: 'Industria',
          sub: 'Plantilla base de taxonomía (periodismo, retail, SaaS, …)',
          value: 'Periodismo / medios independientes', control: 'input',
        },
        {
          label: 'Categorías de audiencia',
          sub: '5 categorías activas: lectora habitual, estudiante de periodismo, crítica…',
          control: 'button', buttonLabel: 'Editar taxonomía',
        },
        {
          label: 'Temas que importan',
          sub: 'Vivienda, política provincial, suscripciones…',
          control: 'button', buttonLabel: 'Editar temas',
        },
        {
          label: 'Alertas operativas',
          sub: 'Cluster de quejas, caídas de suscriptores, picos negativos',
          control: 'button', buttonLabel: 'Configurar',
        },
      ],
      footnote: 'Bloqueante cuando entre el segundo cliente — ver TODO.md.',
    },
    {
      title: 'Política de IA',
      description: 'Qué puede sugerir SETIQ y con qué tono.',
      rows: [
        {
          label: 'Tono de respuestas sugeridas',
          sub: 'Empático y profesional',
          control: 'toggle', toggleOn: true,
        },
        {
          label: 'Auto-responder consultas frecuentes',
          sub: 'Sólo después de aprobación humana',
          control: 'toggle', toggleOn: false,
        },
        {
          label: 'Generar recomendaciones comerciales',
          sub: 'Sugerencias de campañas y segmentos',
          control: 'toggle', toggleOn: true,
        },
        {
          label: 'Resumen diario por correo',
          sub: '09:00 La Paz · hola@thalma.bo',
          control: 'toggle', toggleOn: true,
        },
      ],
    },
    {
      title: 'Etiquetas de canales',
      description: 'Cómo se muestran tus cuentas conectadas en el inbox y los dashboards.',
      rows: [
        { label: 'Instagram',         sub: '@thalma.bo',        control: 'input', value: '@thalma.bo' },
        { label: 'Facebook',          sub: 'Thalma · Página',   control: 'input', value: 'Thalma · Página' },
        { label: 'TikTok',            sub: '@thalma.periodista', control: 'input', value: '@thalma.periodista' },
        { label: 'Email',             sub: 'hola@thalma.bo',    control: 'input', value: 'hola@thalma.bo' },
      ],
      footnote: 'Para editar la cuenta conectada, ir a Canales.',
    },
    {
      title: 'Facturación',
      description: 'Pendiente de incorporación de la empresa — sin cargos por ahora.',
      future: true,
      rows: [
        { label: 'Método de pago',  sub: 'No configurado',        control: 'button', buttonLabel: 'Agregar' },
        { label: 'Razón social',    sub: 'Sin empresa formada todavía', control: 'button', buttonLabel: 'Configurar' },
        { label: 'Próximo cargo',   sub: 'N/A',                   control: 'status', status: 'off', value: 'Sin cargo' },
        { label: 'Historial',       sub: '0 facturas emitidas',   control: 'button', buttonLabel: 'Ver' },
      ],
      footnote: 'Se activa cuando se incorpora el NIT en FUNDEMPRESA.',
    },
    {
      title: 'Webhooks y API',
      description: 'Cómo recibimos eventos de Meta + endpoints expuestos.',
      future: true,
      rows: [
        {
          label: 'Verify token (Meta)',
          sub: 'Usado para validar el handshake de Meta webhooks',
          control: 'input', value: '••••••••••••••••',
        },
        {
          label: 'Webhook URL',
          sub: 'POST /webhooks/meta (configurada en la Meta App)',
          control: 'input', value: 'https://api.setiq.bo/webhooks/meta',
        },
        {
          label: 'API token de servicio',
          sub: 'Para integraciones desde tu sistema interno',
          control: 'button', buttonLabel: 'Generar',
        },
      ],
    },
    {
      title: 'Privacidad y retención de datos',
      description: 'Cuánto tiempo guardamos cada tipo de dato y quién puede acceder.',
      future: true,
      rows: [
        {
          label: 'Mensajes y conversaciones',
          sub: 'Indefinido por ahora; se puede setear hard-delete por antigüedad',
          control: 'input', value: 'Sin expiración',
        },
        {
          label: 'Webhook logs crudos',
          sub: 'Para replay/debug — recomendamos 30 días',
          control: 'input', value: '30 días',
        },
        {
          label: 'Mentions de Apify',
          sub: 'Datos públicos; auto-expiran cuando el actor no los devuelve más',
          control: 'input', value: '90 días',
        },
        {
          label: 'Logs de clasificación de Claude',
          sub: 'Útil para auditar prompts; se purgan cada 90 días',
          control: 'input', value: '90 días',
        },
      ],
      footnote: 'Bloqueante para cumplir requerimientos cuando entre el primer cliente con datos sensibles.',
    },
  ];

  noop(): void {
    // intentional no-op — the page is read-only today
  }
}
