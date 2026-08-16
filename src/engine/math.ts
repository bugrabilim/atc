import type { Vector2 } from './types';

export const normalizeHeading = (value: number): number => ((value % 360) + 360) % 360;

export function shortestTurnDelta(current: number, target: number): number {
  return ((normalizeHeading(target) - normalizeHeading(current) + 540) % 360) - 180;
}

export function turnToward(
  current: number,
  target: number,
  maxStep: number,
  direction: 'shortest' | 'left' | 'right',
): number {
  let delta = shortestTurnDelta(current, target);
  if (direction === 'left' && delta > 0) delta -= 360;
  if (direction === 'right' && delta < 0) delta += 360;
  const step = Math.max(-maxStep, Math.min(maxStep, delta));
  return normalizeHeading(current + step);
}

export function moveToward(current: number, target: number, maxStep: number): number {
  if (Math.abs(target - current) <= maxStep) return target;
  return current + Math.sign(target - current) * maxStep;
}

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

