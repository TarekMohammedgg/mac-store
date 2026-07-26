import * as React from 'react';
import Link from 'next/link';

import { ImageThumb } from '@/components/shared/image-thumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { formatPrice, formatRam, formatStorage } from '@/lib/format';
import type { Product } from '@/models/product';

interface ProductCardProps {
  product: Product;
}

function ProductCardImpl({ product }: ProductCardProps) {
  const labels = useLocalizedLabels();
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="aspect-square bg-muted">
          <ImageThumb imageId={product.coverImageId} alt={product.model} />
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>{labels.productCategory(product.category)}</span>
            <Badge
              variant={
                product.availability === 'available'
                  ? 'success'
                  : product.availability === 'sold'
                    ? 'destructive'
                    : 'secondary'
              }
              className="text-[10px]"
            >
              {labels.availability(product.availability)}
            </Badge>
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.model}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{product.cpu}</span>
            <span aria-hidden>·</span>
            <span>{formatRam(product.ram)}</span>
            <span aria-hidden>·</span>
            <span>
              {formatStorage(product.storage)} {product.storageType}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-semibold">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted-foreground">
              {labels.condition(product.condition)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export const ProductCard = React.memo(ProductCardImpl);
ProductCard.displayName = 'ProductCard';
