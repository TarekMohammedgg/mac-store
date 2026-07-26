import {
  AccessoryCardSkeleton,
  ProductCardSkeleton,
} from '@/components/shared/skeletons';
import { HOME_CARD_GRID_CLASS, HOME_CARD_LIMIT } from '@/components/home/home-constants';

export function HomeSectionsSkeleton() {
  return (
    <div className="container-narrow space-y-12 pb-24">
      <section className="grid gap-3 pb-4 sm:grid-cols-2">
        <div className="h-[4.75rem] animate-pulse rounded-xl border bg-muted" />
        <div className="h-[4.75rem] animate-pulse rounded-xl border bg-muted" />
      </section>
      <section className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className={HOME_CARD_GRID_CLASS}>
          {Array.from({ length: HOME_CARD_LIMIT }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className={HOME_CARD_GRID_CLASS}>
          {Array.from({ length: HOME_CARD_LIMIT }).map((_, i) => (
            <AccessoryCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
