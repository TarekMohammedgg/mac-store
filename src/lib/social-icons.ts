import {
  Facebook,
  Instagram,
  Linkedin,
  Link2,
  MessageCircle,
  type LucideIcon,
  Send,
  Twitter,
  Youtube,
} from 'lucide-react';

import type { SocialPlatform } from '@/models/settings';

const PLATFORM_ICONS: Record<SocialPlatform, LucideIcon> = {
  facebook: Facebook,
  whatsapp: MessageCircle,
  instagram: Instagram,
  x: Twitter,
  youtube: Youtube,
  telegram: Send,
  tiktok: Link2,
  linkedin: Linkedin,
  other: Link2,
};

export function getSocialPlatformIcon(platform: SocialPlatform): LucideIcon {
  return PLATFORM_ICONS[platform] ?? Link2;
}
