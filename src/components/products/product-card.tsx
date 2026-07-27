import * as React from 'react';
import Link from 'next/link';

import { ImageThumb } from '@/components/shared/image-thumb';
import { Badge } from '@/components/ui/badge';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { formatPrice, formatRam, formatStorage } from '@/lib/format';
import type { Product } from '@/models/product';

interface ProductCardProps {
  product: Product;
}

function availabilityVariant(availability: Product['availability']) {
  if (availability === 'available') return 'success' as const;
  if (availability === 'sold') return 'destructive' as const;
  return 'secondary' as const;
}

function buildSpecLine(product: Product): string {
  const parts: string[] = [];
  if (product.year !== null) parts.push(String(product.year));
  if (product.screenSize) parts.push(product.screenSize);
  if (product.cpu) parts.push(product.cpu);
  parts.push(formatRam(product.ram));
  parts.push(`${formatStorage(product.storage)} ${product.storageType}`);
  if (product.gpu) parts.push(product.gpu);
  return parts.join(' · ');
}

function ProductCardImpl({ product }: ProductCardProps) {
  const labels = useLocalizedLabels();

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-[border-color,box-shadow] duration-300 ease-out group-hover:border-foreground/25 group-hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)] dark:group-hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ImageThumb
            imageId={product.coverImageId}
            alt={product.model}
            className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.04]"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {labels.productCategory(product.category)}
            </span>
            <Badge
              variant={availabilityVariant(product.availability)}
              className="shrink-0 px-2 py-0 text-[10px] font-medium tracking-wide"
            >
              {labels.availability(product.availability)}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground">
              {product.model}
            </h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">{buildSpecLine(product)}</p>
            {product.warranty ? (
              <p className="line-clamp-1 text-xs text-muted-foreground/90">{product.warranty}</p>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
            <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="pb-0.5 text-xs text-muted-foreground">
              {labels.condition(product.condition)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export const ProductCard = React.memo(ProductCardImpl);
ProductCard.displayName = 'ProductCard';
