import { cn } from '@/lib/utils';

function SkeletonBlock({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-3">
      <SkeletonBlock className="h-9 w-1/3" />
      <SkeletonBlock className="h-4 w-2/3" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <SkeletonBlock className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="flex justify-between pt-1">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function AccessoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <SkeletonBlock className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-4 w-3/4" />
        <div className="flex justify-between pt-1">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AccessoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <AccessoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-4 w-4 rounded-full" />
      </div>
      <SkeletonBlock className="mb-2 h-7 w-1/2" />
      <SkeletonBlock className="h-3 w-3/4" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b p-4">
      <SkeletonBlock className="h-10 w-10 rounded-md" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-4 w-20" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-4">
        <SkeletonBlock className="h-9 w-full max-w-sm" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="container-narrow py-8 sm:py-12">
      <SkeletonBlock className="mb-6 h-8 w-40" />
      <div className="grid gap-10 lg:grid-cols-2">
        <SkeletonBlock className="aspect-square w-full rounded-lg" />
        <div className="space-y-6">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-10 w-3/4" />
          <SkeletonBlock className="h-12 w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 flex-1" />
        <SkeletonBlock className="h-10 w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function HomeSectionsSkeleton() {
  return (
    <div className="container-narrow space-y-12 pb-24">
      <section className="grid gap-4 pb-4 sm:grid-cols-2">
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
      </section>
      <section className="space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </section>
      <section className="space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}
