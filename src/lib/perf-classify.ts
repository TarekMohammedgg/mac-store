/**
 * Threshold-based classifier for guarding against regressions in
 * dataset sizes that affect render performance.
 */
export function classify(value: number, threshold: number): 'small' | 'large' {
  return value < threshold ? 'small' : 'large';
}
