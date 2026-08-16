import { useCallback, useEffect, useRef } from 'react';
import { aircraftTrend } from '../engine/simulation';
import type { Aircraft, Conflict, RadarWorld, Vector2 } from '../engine/types';

interface RadarScopeProps {
  world: RadarWorld;
  aircraft: Aircraft[];
  conflicts: Conflict[];
  selectedCallsign: string | null;
  onSelect: (callsign: string) => void;
}

interface Viewport {
  width: number;
  height: number;
  scale: number;
  center: Vector2;
}

function worldToScreen(point: Vector2, viewport: Viewport): Vector2 {
  return {
    x: viewport.center.x + point.x * viewport.scale,
    y: viewport.center.y + point.y * viewport.scale,
  };
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Vector2,
  to: Vector2,
  color: string,
  width = 1,
  dash: number[] = [],
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function conflictFor(callsign: string, conflicts: Conflict[]) {
  return conflicts.find((conflict) => conflict.pair.includes(callsign));
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  world: RadarWorld,
  aircraft: Aircraft[],
  conflicts: Conflict[],
  selectedCallsign: string | null,
) {
  const { width, height, center, scale } = viewport;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#020807';
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y, Math.max(width, height) * 0.65);
  glow.addColorStop(0, 'rgba(18, 80, 57, 0.16)');
  glow.addColorStop(0.65, 'rgba(4, 25, 19, 0.06)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(68, 148, 111, 0.22)';
  ctx.lineWidth = 1;
  ctx.font = '10px IBM Plex Mono, ui-monospace, monospace';
  ctx.fillStyle = 'rgba(100, 184, 144, 0.46)';
  for (let radiusNm = 10; radiusNm <= world.rangeNm; radiusNm += 10) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radiusNm * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(`${radiusNm}`, center.x + 5, center.y - radiusNm * scale + 12);
  }

  drawLine(ctx, { x: center.x, y: 0 }, { x: center.x, y: height }, 'rgba(68, 148, 111, 0.12)');
  drawLine(ctx, { x: 0, y: center.y }, { x: width, y: center.y }, 'rgba(68, 148, 111, 0.12)');

  for (const runway of world.runways) {
    const midpoint = worldToScreen(runway.center, viewport);
    const radians = (runway.heading * Math.PI) / 180;
    const half = runway.lengthNm * scale * 0.5;
    const vector = { x: Math.sin(radians) * half, y: -Math.cos(radians) * half };
    const from = { x: midpoint.x - vector.x, y: midpoint.y - vector.y };
    const to = { x: midpoint.x + vector.x, y: midpoint.y + vector.y };
    const color = runway.active ? '#6ef3b0' : 'rgba(86, 142, 115, 0.38)';
    drawLine(ctx, from, to, color, runway.active ? 3 : 2);
    if (runway.active && runway.operation === 'arrival') {
      const extension = { x: vector.x * 9, y: vector.y * 9 };
      drawLine(ctx, from, { x: from.x - extension.x, y: from.y - extension.y }, 'rgba(110, 243, 176, 0.32)', 1, [6, 7]);
      const inboundAircraft = aircraft.find((item) => item.approach?.runwayId === runway.id);
      if (inboundAircraft) {
        drawLine(ctx, from, { x: from.x - extension.x, y: from.y - extension.y }, '#67e8c4', 2, [4, 4]);
        ctx.fillStyle = '#67e8c4';
        ctx.font = '700 9px IBM Plex Mono, ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`ILS ${runway.id}`, from.x - extension.x + 5, from.y - extension.y - 5);
      }
    }
    ctx.fillStyle = color;
    ctx.font = '700 10px IBM Plex Mono, ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(runway.id, to.x, to.y - 7);
    ctx.fillText(runway.reciprocal, from.x, from.y + 13);
  }

  for (const fix of world.fixes) {
    const point = worldToScreen(fix.position, viewport);
    ctx.strokeStyle = 'rgba(93, 190, 147, 0.62)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - 4);
    ctx.lineTo(point.x + 4, point.y + 3);
    ctx.lineTo(point.x - 4, point.y + 3);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(125, 214, 173, 0.64)';
    ctx.textAlign = 'left';
    ctx.font = '9px IBM Plex Mono, ui-monospace, monospace';
    ctx.fillText(fix.id, point.x + 7, point.y + 3);
  }

  for (const item of aircraft) {
    const point = worldToScreen(item.position, viewport);
    const selected = selectedCallsign === item.callsign;
    const conflict = conflictFor(item.callsign, conflicts);
    const color = conflict?.severity === 'loss' ? '#ff5d5d' : conflict ? '#ffb648' : item.priority ? '#ffb648' : selected ? '#ffffff' : item.phase === 'arrival' ? '#67e8c4' : '#79b9ff';
    const headingRadians = (item.heading * Math.PI) / 180;
    const targetRadians = (item.targetHeading * Math.PI) / 180;
    const activeFix = item.navigation?.fixIds[item.navigation.currentLegIndex];
    const fix = activeFix ? world.fixes.find((entry) => entry.id === activeFix) : undefined;

    if (fix) {
      const fixPoint = worldToScreen(fix.position, viewport);
      drawLine(ctx, point, fixPoint, item.navigation?.mode === 'hold' ? 'rgba(255, 182, 72, 0.46)' : 'rgba(121, 185, 255, 0.38)', 1, [2, 5]);
    }

    drawLine(
      ctx,
      point,
      { x: point.x + Math.sin(headingRadians) * 20, y: point.y - Math.cos(headingRadians) * 20 },
      color,
      1,
    );
    drawLine(
      ctx,
      point,
      { x: point.x + Math.sin(targetRadians) * 40, y: point.y - Math.cos(targetRadians) * 40 },
      `${color}66`,
      1,
      [3, 4],
    );

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selected ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (selected || conflict) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, selected ? 12 : 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    const leaderEnd = { x: point.x + 13, y: point.y - 12 };
    drawLine(ctx, point, leaderEnd, color, 1);
    const trend = aircraftTrend(item);
    const trendSymbol = trend === 'climb' ? '↑' : trend === 'descend' ? '↓' : '—';
    const currentFlightLevel = String(Math.round(item.altitude / 100)).padStart(3, '0');
    const targetFlightLevel = String(Math.round(item.targetAltitude / 100)).padStart(3, '0');
    ctx.font = `${selected ? '700' : '500'} 10px IBM Plex Mono, ui-monospace, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(item.callsign, leaderEnd.x + 3, leaderEnd.y - 2);
    ctx.fillText(`${currentFlightLevel}${trendSymbol}${targetFlightLevel}  ${Math.round(item.speed)}`, leaderEnd.x + 3, leaderEnd.y + 10);
    if (item.priority) {
      ctx.fillStyle = '#ffb648';
      ctx.font = '700 8px IBM Plex Mono, ui-monospace, monospace';
      ctx.fillText(item.priority.alertRaised ? 'ÖNCELİK GECİKTİ' : 'ÖNCELİK', leaderEnd.x + 3, leaderEnd.y + 21);
    } else if (item.handoffCleared) {
      ctx.fillStyle = '#79b9ff';
      ctx.font = '700 8px IBM Plex Mono, ui-monospace, monospace';
      ctx.fillText('HANDOFF', leaderEnd.x + 3, leaderEnd.y + 21);
    } else if (item.approach) {
      ctx.fillStyle = '#67e8c4';
      ctx.font = '700 8px IBM Plex Mono, ui-monospace, monospace';
      ctx.fillText(`ILS ${item.approach.runwayId} · ${item.approach.status === 'captured' ? item.approach.landingCleared ? 'LAND' : 'CAPTURED' : 'ARMED'}`, leaderEnd.x + 3, leaderEnd.y + 21);
    } else if (activeFix) {
      ctx.fillStyle = item.navigation?.mode === 'hold' ? '#ffb648' : '#79b9ff';
      ctx.font = '700 8px IBM Plex Mono, ui-monospace, monospace';
      ctx.fillText(`${item.navigation?.mode === 'hold' ? 'HOLD' : 'DCT'} ${activeFix}`, leaderEnd.x + 3, leaderEnd.y + 21);
    }
  }

  ctx.fillStyle = 'rgba(110, 243, 176, 0.48)';
  ctx.font = '9px IBM Plex Mono, ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SIMÜLASYON · OPERASYONEL KULLANIM İÇİN DEĞİLDİR', 14, height - 14);
}

export function RadarScope({ world, aircraft, conflicts, selectedCallsign, onSelect }: RadarScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<Viewport | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      viewportRef.current = {
        width: rect.width,
        height: rect.height,
        scale: Math.min(rect.width, rect.height) / (world.rangeNm * 2.15),
        center: { x: rect.width / 2, y: rect.height / 2 + Math.min(24, rect.height * 0.04) },
      };
      drawRadar(ctx, viewportRef.current, world, aircraft, conflicts, selectedCallsign);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext('2d');
    if (ctx) drawRadar(ctx, viewport, world, aircraft, conflicts, selectedCallsign);
  }, [aircraft, conflicts, selectedCallsign, world]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const rect = canvas.getBoundingClientRect();
    const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    let closest: { callsign: string; distance: number } | null = null;
    for (const item of aircraft) {
      const point = worldToScreen(item.position, viewport);
      const hitDistance = Math.hypot(pointer.x - point.x, pointer.y - point.y);
      if (hitDistance <= 28 && (!closest || hitDistance < closest.distance)) {
        closest = { callsign: item.callsign, distance: hitDistance };
      }
    }
    if (closest) onSelect(closest.callsign);
  }, [aircraft, onSelect]);

  return (
    <div className="radar-frame" aria-label="İstanbul yaklaşma radar ekranı">
      <div className="scope-corner scope-corner--top-left" />
      <div className="scope-corner scope-corner--bottom-right" />
      <canvas
        ref={canvasRef}
        className="radar-canvas"
        onPointerDown={handlePointerDown}
        aria-label="Uçak seçmek için radar hedeflerine dokun"
      />
    </div>
  );
}
