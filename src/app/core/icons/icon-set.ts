/**
 * Names of icons supported by IconComponent. The actual SVG paths are
 * inlined in the component template (not as strings here) so SSR can
 * render them — setting innerHTML on an SVG element is not supported
 * by Angular's SSR DOM emulator.
 */
export type IconName =
  | 'search'
  | 'chevron-down'
  | 'star'
  | 'theme'
  | 'arrow-up'
  | 'arrow-down'
  | 'check'
  | 'x'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'email';
