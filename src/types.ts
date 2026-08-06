export type Locale = 'pt' | 'en';

export type PlatformCategory = 'general' | 'adult' | 'special';

export interface Platform {
  id: string;
  label: string;
  category: PlatformCategory;
  match: RegExp[];
  extractorHints?: Record<string, string | boolean | number>;
}

export interface FormatOption {
  id: string;
  formatId: string;
  height: number | null;
  resolutionLabel: string;
  ext: string;
  filesizeBytes: number | null;
  filesizeApprox: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  label: string;
}

export interface VideoProbeResult {
  title: string;
  webpageUrl: string;
  formats: FormatOption[];
}

export interface DownloadRequest {
  url: string;
  formatId: string;
  outputDir: string;
  filenameBase: string;
  platformId?: string;
}

export interface DownloadResult {
  filePath: string;
  title: string;
}

export type WizardStep =
  | 'url'
  | 'platform'
  | 'others'
  | 'adult'
  | 'ageGate'
  | 'probing'
  | 'format'
  | 'directory'
  | 'downloading'
  | 'done'
  | 'error';

export interface SelectItem {
  value: string;
  label: string;
}
