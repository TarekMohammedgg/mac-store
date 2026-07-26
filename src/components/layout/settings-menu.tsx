'use client';

import * as React from 'react';
import { Check, Globe, Moon, Palette, Sun, Monitor } from 'lucide-react';

import { useI18n } from '@/i18n';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/config/locale.config';
import { useTheme } from '@/components/layout/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function SettingsMenu() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('common.search')}>
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="space-y-1 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('theme.label')}
          </p>
          <div className="grid grid-cols-3 gap-1">
            <ThemeButton
              active={theme === 'light'}
              onClick={() => setTheme('light')}
              label={t('theme.light')}
              icon={<Sun className="h-3.5 w-3.5" />}
            />
            <ThemeButton
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
              label={t('theme.dark')}
              icon={<Moon className="h-3.5 w-3.5" />}
            />
            <ThemeButton
              active={theme === 'system'}
              onClick={() => setTheme('system')}
              label={t('theme.system')}
              icon={<Monitor className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-1 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('language.label')}
          </p>
          <div className="space-y-1">
            {LOCALES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocale(option as Locale)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                  option === locale
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-pressed={option === locale}
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  {LOCALE_LABELS[option]}
                </span>
                {option === locale && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
