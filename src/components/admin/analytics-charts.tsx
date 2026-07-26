'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface BarItem {
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
      {items.map((item) => (
        <li key={item.label} className="space-y-1">
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

export function TrendAreaChart({
  points,
  emptyLabel,
}: {
  points: { date: string; revenue: number; profit: number }[];
  emptyLabel: string;
}) {
  const width = 640;
  const height = 180;
  const padX = 8;
  const padY = 12;
  const max = Math.max(...points.map((p) => p.revenue), 1);

  if (points.every((p) => p.revenue === 0)) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const coords = points.map((point, index) => {
    const x =
      padX + (points.length === 1 ? 0 : (index / (points.length - 1)) * (width - padX * 2));
    const y = height - padY - (point.revenue / max) * (height - padY * 2);
    return { x, y, ...point };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img">
        <path d={area} className="fill-foreground/10" />
        <path d={line} className="stroke-foreground fill-none" strokeWidth="2.5" />
        {coords
          .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === coords.length - 1)
          .map((c) => (
            <circle key={c.date} cx={c.x} cy={c.y} r="3" className="fill-foreground" />
          ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
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
      {items.map((item) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {item.share.toFixed(1)}% · {item.valueLabel}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full bg-foreground/70')}
              style={{ width: `${Math.max(3, item.share)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
