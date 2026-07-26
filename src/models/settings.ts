export const SOCIAL_PLATFORMS = [
  'facebook',
  'whatsapp',
  'instagram',
  'x',
  'youtube',
  'telegram',
  'tiktok',
  'linkedin',
  'other',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
}

export interface AppSettings {
  id: 'app';
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  currency: string;
  showSerialNumber: boolean;
  defaultAdminUsername: string;
  socialLinks: SocialLink[];
  updatedAt: string;
}

export function createDefaultSocialLinks(): SocialLink[] {
  return [
    { id: 'social_facebook', platform: 'facebook', label: 'Facebook', url: '' },
    { id: 'social_whatsapp', platform: 'whatsapp', label: 'WhatsApp', url: '' },
  ];
}
