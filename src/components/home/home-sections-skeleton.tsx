export function HomeSectionsSkeleton() {
  return (
    <div className="container-narrow space-y-12 pb-24">
      <section className="grid gap-3 pb-4 sm:grid-cols-2">
        <div className="h-[4.75rem] animate-pulse rounded-xl border bg-muted" />
        <div className="h-[4.75rem] animate-pulse rounded-xl border bg-muted" />
      </section>
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </section>
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </section>
    </div>
  );
}
