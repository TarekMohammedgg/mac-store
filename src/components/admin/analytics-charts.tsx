'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface BarItem {
  id?: string;
  label: string;
  value: number;
  hint?: string;
}

export function HorizontalBarChart({
  items,
  formatValue,
  emptyLabel,
}: {
  items: BarItem[];
  formatValue: (value: number) => string;
  emptyLabel: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={item.id ?? `${item.label}-${index}`} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatValue(item.value)}
              {item.hint ? ` · ${item.hint}` : ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/80 transition-all"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function buildPath(
  coords: { x: number; y: number }[],
): string {
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function TrendAreaChart({
  points,
  emptyLabel,
  revenueLabel,
  profitLabel,
  formatValue,
  unitsLabel,
}: {
  points: { date: string; revenue: number; profit: number; units?: number }[];
  emptyLabel: string;
  revenueLabel?: string;
  profitLabel?: string;
  formatValue: (value: number) => string;
  unitsLabel?: (count: number) => string;
}) {
  const width = 640;
  const height = 200;
  const padX = 12;
  const padY = 16;
  const plotLeft = padX / width;
  const plotRight = (width - padX) / width;
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [showRevenue, setShowRevenue] = React.useState(true);
  const [showProfit, setShowProfit] = React.useState(true);

  const max = Math.max(
    ...points.map((p) =>
      Math.max(showRevenue ? p.revenue : 0, showProfit ? p.profit : 0),
    ),
    1,
  );

  if (points.every((p) => p.revenue === 0 && p.profit === 0)) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const plotWidth = width - padX * 2;
  const toX = (index: number) =>
    padX + (points.length === 1 ? 0 : (index / (points.length - 1)) * plotWidth);
  const toY = (value: number) => height - padY - (value / max) * (height - padY * 2);

  const revenueCoords = points.map((point, index) => ({
    x: toX(index),
    y: toY(point.revenue),
    ...point,
  }));
  const profitCoords = points.map((point, index) => ({
    x: toX(index),
    y: toY(point.profit),
  }));

  const revenueLine = buildPath(revenueCoords);
  const profitLine = buildPath(profitCoords);
  const area = showRevenue
    ? `${revenueLine} L ${revenueCoords[revenueCoords.length - 1].x} ${height - padY} L ${revenueCoords[0].x} ${height - padY} Z`
    : '';

  const active = activeIndex !== null ? points[activeIndex] : null;
  const activeX = activeIndex !== null ? toX(activeIndex) : null;
  const activeLeftPct = activeX !== null ? (activeX / width) * 100 : 0;

  const resolveIndexFromClientX = (clientX: number, target: HTMLElement) => {
    if (points.length === 0) return null;
    if (points.length === 1) return 0;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const ratio = (clientX - rect.left) / rect.width;
    const plotT = (ratio - plotLeft) / (plotRight - plotLeft);
    return Math.round(clamp(plotT, 0, 1) * (points.length - 1));
  };

  const onPlotPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const next = resolveIndexFromClientX(event.clientX, event.currentTarget);
    if (next !== null) setActiveIndex(next);
  };

  const tooltipSide =
    activeIndex !== null && activeIndex > points.length * 0.65 ? 'start' : 'end';

  return (
    <div className="w-full" dir="ltr" style={{ direction: 'ltr' }}>
      <div
        className="relative"
        onPointerLeave={() => setActiveIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="pointer-events-none h-48 w-full"
          style={{ direction: 'ltr' }}
          role="img"
          aria-label={[revenueLabel, profitLabel].filter(Boolean).join(' / ')}
        >
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = padY + (1 - ratio) * (height - padY * 2);
            return (
              <line
                key={ratio}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                className="stroke-border/70"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            );
          })}

          {area ? <path d={area} className="fill-foreground/8" /> : null}
          {showRevenue ? (
            <path d={revenueLine} className="stroke-foreground fill-none" strokeWidth="2.5" />
          ) : null}
          {showProfit ? (
            <path
              d={profitLine}
              className="stroke-foreground/45 fill-none"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          ) : null}

          {activeX !== null ? (
            <line
              x1={activeX}
              x2={activeX}
              y1={padY}
              y2={height - padY}
              className="stroke-foreground/30"
              strokeWidth="1"
            />
          ) : null}

          {activeIndex !== null && showRevenue ? (
            <circle
              cx={toX(activeIndex)}
              cy={toY(points[activeIndex].revenue)}
              r="4.5"
              className="fill-background stroke-foreground"
              strokeWidth="2"
            />
          ) : null}
          {activeIndex !== null && showProfit ? (
            <circle
              cx={toX(activeIndex)}
              cy={toY(points[activeIndex].profit)}
              r="4"
              className="fill-background stroke-foreground/50"
              strokeWidth="2"
            />
          ) : null}
        </svg>

        {/* HTML hit layer — maps 1:1 with preserveAspectRatio=none plot */}
        <div
          className="absolute inset-0 touch-none cursor-crosshair"
          onPointerMove={onPlotPointer}
          onPointerDown={onPlotPointer}
          role="presentation"
        />

        {active && activeX !== null ? (
          <div
            className={cn(
              'pointer-events-none absolute top-2 z-10 min-w-[9.5rem] rounded-md border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm',
              tooltipSide === 'end' ? 'translate-x-2' : '-translate-x-full -ms-2',
            )}
            style={{ left: `${activeLeftPct}%` }}
          >
            <div className="mb-1.5 font-medium tabular-nums text-foreground">{active.date}</div>
            {showRevenue && revenueLabel ? (
              <div className="flex items-center justify-between gap-4 text-muted-foreground">
                <span>{revenueLabel}</span>
                <span className="tabular-nums text-foreground">{formatValue(active.revenue)}</span>
              </div>
            ) : null}
            {showProfit && profitLabel ? (
              <div className="mt-0.5 flex items-center justify-between gap-4 text-muted-foreground">
                <span>{profitLabel}</span>
                <span className="tabular-nums text-foreground">{formatValue(active.profit)}</span>
              </div>
            ) : null}
            {unitsLabel && typeof active.units === 'number' && active.units > 0 ? (
              <div className="mt-0.5 text-muted-foreground">{unitsLabel(active.units)}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="tabular-nums">{points[0]?.date}</span>
        <div className="flex items-center gap-1">
          {revenueLabel ? (
            <button
              type="button"
              onClick={() => setShowRevenue((v) => (showProfit || v ? !v : v))}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted',
                !showRevenue && 'opacity-40',
              )}
              aria-pressed={showRevenue}
            >
              <span className="inline-block h-0.5 w-3 bg-foreground" />
              {revenueLabel}
            </button>
          ) : null}
          {profitLabel ? (
            <button
              type="button"
              onClick={() => setShowProfit((v) => (showRevenue || v ? !v : v))}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted',
                !showProfit && 'opacity-40',
              )}
              aria-pressed={showProfit}
            >
              <span className="inline-block h-0.5 w-3 border-t border-dashed border-foreground/50" />
              {profitLabel}
            </button>
          ) : null}
        </div>
        <span className="tabular-nums">{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function ShareBars({
  items,
  emptyLabel,
}: {
  items: { label: string; share: number; valueLabel: string }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.valueLabel} · {item.share}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full bg-foreground/70 transition-all')}
              style={{ width: `${Math.max(4, item.share)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
