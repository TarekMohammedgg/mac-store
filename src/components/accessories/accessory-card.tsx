import * as React from 'react';
import Link from 'next/link';

import { ImageThumb } from '@/components/shared/image-thumb';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { formatPrice } from '@/lib/format';
import type { Accessory } from '@/models/accessory';

interface AccessoryCardProps {
  accessory: Accessory;
}

function AccessoryCardImpl({ accessory }: AccessoryCardProps) {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const inStock = accessory.availability && accessory.quantity > 0;

  return (
    <Link
      href={`/accessories/${accessory.id}`}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-[border-color,box-shadow] duration-300 ease-out group-hover:border-foreground/25 group-hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)] dark:group-hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ImageThumb
            imageId={accessory.coverImageId}
            alt={accessory.name}
            className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.04]"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {labels.accessoryCategory(accessory.category)}
            </span>
            <Badge
              variant={inStock ? 'success' : 'destructive'}
              className="shrink-0 px-2 py-0 text-[10px] font-medium tracking-wide"
            >
              {inStock ? t('accessory.inStock') : t('accessory.outOfStock')}
            </Badge>
          </div>

          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground">
            {accessory.name}
          </h3>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
            <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatPrice(accessory.price)}
            </span>
            <span className="pb-0.5 text-xs text-muted-foreground">
              {accessory.quantity} {t('accessory.unitsAvailable')}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export const AccessoryCard = React.memo(AccessoryCardImpl);
AccessoryCard.displayName = 'AccessoryCard';
