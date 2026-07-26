import * as React from 'react';
import Link from 'next/link';

import { ImageThumb } from '@/components/shared/image-thumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    <Link href={`/accessories/${accessory.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="aspect-square bg-muted">
          <ImageThumb imageId={accessory.coverImageId} alt={accessory.name} />
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>{labels.accessoryCategory(accessory.category)}</span>
            <Badge variant={inStock ? 'success' : 'destructive'} className="text-[10px]">
              {inStock ? t('accessory.inStock') : t('accessory.outOfStock')}
            </Badge>
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{accessory.name}</h3>
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-semibold">{formatPrice(accessory.price)}</span>
            <span className="text-xs text-muted-foreground">
              {accessory.quantity} {t('accessory.unitsAvailable')}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export const AccessoryCard = React.memo(AccessoryCardImpl);
AccessoryCard.displayName = 'AccessoryCard';
