'use client';

import Link from 'next/link';

import { BrandLogo } from '@/components/brand/brand-logo';
import { useI18n } from '@/i18n';
import { getSocialPlatformIcon } from '@/lib/social-icons';
import { useAuthStore } from '@/stores/auth.store';
import {
  useSocialLinks,
  useStoreBrandName,
  useStoreDescription,
  useSettingsStore,
} from '@/stores/settings.store';

export function SiteFooter() {
  const { t, dictionary } = useI18n();
  const brandName = useStoreBrandName(dictionary.brand.name);
  const storeDescription = useStoreDescription();
  const socialLinks = useSocialLinks().filter((link) => link.url.trim());
  const contactEmail = useSettingsStore((state) => state.settings?.contactEmail);
  const session = useAuthStore((state) => state.session);

  return (
    <footer className="mt-16 border-t">
      <div className="container-narrow flex flex-col gap-8 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <BrandLogo size="sm" />
              <span>
                {brandName} · {t('home.badge')}
              </span>
            </div>
            {storeDescription ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{storeDescription}</p>
            ) : null}
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                {contactEmail}
              </a>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/products" className="hover:text-foreground">
                {t('nav.devices')}
              </Link>
              <Link href="/accessories" className="hover:text-foreground">
                {t('nav.accessories')}
              </Link>
              {session?.role === 'admin' ? (
                <Link href="/admin" prefetch className="hover:text-foreground">
                  {t('nav.dashboard')}
                </Link>
              ) : session ? null : (
                <Link href="/login" prefetch className="hover:text-foreground">
                  {t('nav.signIn')}
                </Link>
              )}
            </div>

            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2" aria-label={t('footer.socialLinks')}>
                {socialLinks.map((link) => {
                  const Icon = getSocialPlatformIcon(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      aria-label={link.label || link.platform}
                      title={link.label || link.platform}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t('footer.notice')}</p>
      </div>
    </footer>
  );
}
