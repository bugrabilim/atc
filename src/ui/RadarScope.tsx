import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { arrivalAdvice, type ArrivalAdvice } from '../engine/arrivalAdvisor';
import { predictAircraftPath } from '../engine/aircraftDynamics';
import { aircraftTrend } from '../engine/simulation';
import { requiredWakeSeparationNm } from '../engine/wake';
import type { Aircraft, Conflict, RadarWorld, Vector2 } from '../engine/types';
import type { CoachAdvice } from '../engine/controllerCoach';

interface RadarScopeProps {
  world: RadarWorld;
  aircraft: Aircraft[];
  conflicts: Conflict[];
  trackHistory: Record<string, Vector2[]>;
  pendingCallsigns: string[];
  selectedCallsign: string | null;
  coach: CoachAdvice;
  onSelect: (callsign: string) => void;
  onApplyCoach: (advice: CoachAdvice) => void;
}

interface Viewport {
  width: number;
  height: number;
  scale: number;
  centerWorld: Vector2;
}

interface LabelBox {
  callsign: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Measurement {
  from: Vector2;
  to?: Vector2;
}

interface RunwayQueue {
  runwayId: string;
  entries: { aircraft: Aircraft; advice: ArrivalAdvice }[];
}

type DragState =
  | { kind: 'pan'; pointerId: number; last: Vector2 }
  | { kind: 'label'; pointerId: number; callsign: string; last: Vector2 }
  | null;

function worldToScreen(point: Vector2, viewport: Viewport): Vector2 {
  return {
    x: viewport.width / 2 + (point.x - viewport.centerWorld.x) * viewport.scale,
    y: viewport.height / 2 + (point.y - viewport.centerWorld.y) * viewport.scale,
  };
}

function screenToWorld(point: Vector2, viewport: Viewport): Vector2 {
  return {
    x: viewport.centerWorld.x + (point.x - viewport.width / 2) / viewport.scale,
    y: viewport.centerWorld.y + (point.y - viewport.height / 2) / viewport.scale,
  };
}

function initialScale(width: number, height: number, rangeNm: number) {
  // Phone screens should begin at a usable tactical range instead of trying to
  // show the entire sector with unreadably small labels.
  if (width < 760) return Math.max(5.5, Math.min(width, height) / (rangeNm * 1.25));
  return Math.min(width, height) / (rangeNm * 2.05);
}

function drawLine(ctx: CanvasRenderingContext2D, from: Vector2, to: Vector2, color: string, width = 1, dash: number[] = []) {
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

function statusText(aircraft: Aircraft) {
  if (aircraft.approach) return `${aircraft.approach.status.toUpperCase()} ${aircraft.approach.runwayId}`;
  if (aircraft.navigation) return `${aircraft.navigation.mode.toUpperCase()} ${aircraft.navigation.fixIds[aircraft.navigation.currentLegIndex] ?? ''}`;
  if (aircraft.handoffCleared) return 'HANDOFF';
  return aircraft.phase === 'arrival' ? `VECT ${aircraft.assignedRunway ?? ''}` : 'DEPARTURE';
}

function pointAtBearing(bearing: number, distance: number): Vector2 {
  const radians = bearing * Math.PI / 180;
  return { x: Math.sin(radians) * distance, y: -Math.cos(radians) * distance };
}

function drawGeographicContext(ctx: CanvasRenderingContext2D, viewport: Viewport, world: RadarWorld) {
  const { width, height, scale } = viewport;
  const environment = world.environment;
  const terrainColor = environment?.terrain === 'desert' ? '#0e1008'
    : environment?.terrain === 'mountain' || environment?.terrain === 'highland' ? '#07100b'
      : environment?.terrain === 'coastal' || environment?.terrain === 'island' ? '#03100e'
        : '#04100b';
  ctx.fillStyle = terrainColor;
  ctx.fillRect(0, 0, width, height);

  // A chart grid reads like a terminal-area map rather than a decorative
  // circular scope, while still preserving instant distance orientation.
  ctx.save();
  ctx.strokeStyle = 'rgba(91, 160, 126, .08)';
  ctx.lineWidth = 1;
  const gridStep = Math.max(56, 10 * scale);
  for (let x = (width / 2) % gridStep; x < width; x += gridStep) drawLine(ctx, { x, y: 0 }, { x, y: height }, 'rgba(91, 160, 126, .08)');
  for (let y = (height / 2) % gridStep; y < height; y += gridStep) drawLine(ctx, { x: 0, y }, { x: width, y }, 'rgba(91, 160, 126, .08)');
  ctx.restore();

  if (!environment) return;
  const airport = worldToScreen({ x: 0, y: 0 }, viewport);

  if (environment.waterBearing !== undefined) {
    const waterCenter = worldToScreen(pointAtBearing(environment.waterBearing, world.rangeNm * .82), viewport);
    ctx.save();
    ctx.translate(waterCenter.x, waterCenter.y);
    ctx.rotate(environment.waterBearing * Math.PI / 180);
    ctx.fillStyle = 'rgba(5, 42, 48, .62)';
    ctx.strokeStyle = 'rgba(91, 183, 181, .26)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, world.rangeNm * scale * .78, world.rangeNm * scale * .48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let offset = -2; offset <= 2; offset += 1) {
      ctx.beginPath();
      ctx.ellipse(offset * 25, offset * 9, world.rangeNm * scale * (.52 + offset * .035), world.rangeNm * scale * (.25 + offset * .018), 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(91, 183, 181, .09)';
      ctx.stroke();
    }
    ctx.restore();
  }

  if (environment.mountainBearing !== undefined || environment.terrain === 'mountain' || environment.terrain === 'highland') {
    const bearing = environment.mountainBearing ?? 315;
    const ridge = worldToScreen(pointAtBearing(bearing, world.rangeNm * .63), viewport);
    ctx.save();
    ctx.translate(ridge.x, ridge.y);
    ctx.rotate(bearing * Math.PI / 180);
    ctx.strokeStyle = 'rgba(188, 164, 103, .27)';
    ctx.fillStyle = 'rgba(99, 83, 45, .12)';
    for (let layer = 0; layer < 4; layer += 1) {
      ctx.beginPath();
      const span = (13 + layer * 4) * scale;
      ctx.moveTo(-span, layer * 12);
      for (let peak = -3; peak <= 3; peak += 1) {
        ctx.lineTo(peak * span / 3, layer * 12 - (5 + ((peak + layer) % 3) * 3) * scale);
      }
      ctx.lineTo(span, layer * 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  const cityCenter = worldToScreen(pointAtBearing(environment.cityBearing, world.rangeNm * .52), viewport);
  const cityRadius = (environment.urbanDensity === 'metropolis' ? 12 : 8) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cityCenter.x, cityCenter.y, cityRadius * 1.45, cityRadius, environment.cityBearing * Math.PI / 180, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(81, 111, 96, .12)';
  ctx.fillRect(cityCenter.x - cityRadius * 1.6, cityCenter.y - cityRadius * 1.2, cityRadius * 3.2, cityRadius * 2.4);
  ctx.translate(cityCenter.x, cityCenter.y);
  ctx.rotate((environment.cityBearing + 22) * Math.PI / 180);
  for (let offset = -cityRadius * 1.5; offset <= cityRadius * 1.5; offset += Math.max(14, scale * 2.4)) {
    drawLine(ctx, { x: offset, y: -cityRadius * 1.2 }, { x: offset, y: cityRadius * 1.2 }, 'rgba(143, 181, 160, .16)');
    drawLine(ctx, { x: -cityRadius * 1.6, y: offset }, { x: cityRadius * 1.6, y: offset }, 'rgba(143, 181, 160, .12)');
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(147, 205, 177, .5)';
  ctx.font = '700 11px IBM Plex Mono, ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(environment.city.toUpperCase(), cityCenter.x, cityCenter.y - cityRadius - 8);
  ctx.fillStyle = 'rgba(110, 243, 176, .72)';
  ctx.fillRect(airport.x - 3, airport.y - 3, 6, 6);
  ctx.textAlign = 'left';
  ctx.fillText(`${environment.icao} · ELEV ${environment.elevationFt}FT`, airport.x + 9, airport.y - 9);

  // Compact scale instead of range rings; on phones it remains readable and
  // does not cover aircraft labels.
  const scaleLength = 10 * scale;
  const scaleY = height - 30;
  drawLine(ctx, { x: 16, y: scaleY }, { x: 16 + scaleLength, y: scaleY }, 'rgba(110, 243, 176, .55)', 2);
  drawLine(ctx, { x: 16, y: scaleY - 4 }, { x: 16, y: scaleY + 4 }, 'rgba(110, 243, 176, .55)', 2);
  drawLine(ctx, { x: 16 + scaleLength, y: scaleY - 4 }, { x: 16 + scaleLength, y: scaleY + 4 }, 'rgba(110, 243, 176, .55)', 2);
  ctx.fillStyle = 'rgba(110, 243, 176, .55)';
  ctx.font = '700 10px IBM Plex Mono, ui-monospace, monospace';
  ctx.fillText('10 NM', 16, scaleY - 8);
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  world: RadarWorld,
  aircraft: Aircraft[],
  conflicts: Conflict[],
  trackHistory: Record<string, Vector2[]>,
  pendingCallsigns: string[],
  selectedCallsign: string | null,
  arrivalPlan: Map<string, ArrivalAdvice>,
  labelOffsets: Record<string, Vector2>,
  labelBoxes: Map<string, LabelBox>,
  measurement: Measurement | null,
) {
  const { width, height, scale } = viewport;
  ctx.clearRect(0, 0, width, height);
  drawGeographicContext(ctx, viewport, world);

  const airport = worldToScreen({ x: 0, y: 0 }, viewport);
  const glow = ctx.createRadialGradient(airport.x, airport.y, 5, airport.x, airport.y, Math.max(width, height) * 0.7);
  glow.addColorStop(0, 'rgba(18, 80, 57, 0.16)');
  glow.addColorStop(0.7, 'rgba(4, 25, 19, 0.05)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  for (const runway of world.runways) {
    const midpoint = worldToScreen(runway.center, viewport);
    const radians = runway.heading * Math.PI / 180;
    const half = runway.lengthNm * scale * 0.5;
    const vector = { x: Math.sin(radians) * half, y: -Math.cos(radians) * half };
    const from = { x: midpoint.x - vector.x, y: midpoint.y - vector.y };
    const to = { x: midpoint.x + vector.x, y: midpoint.y + vector.y };
    const color = runway.active ? '#6ef3b0' : 'rgba(86, 142, 115, 0.3)';
    drawLine(ctx, from, to, color, runway.active ? 3 : 2);
    if (runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed')) {
      const outbound = { x: -Math.sin(radians), y: Math.cos(radians) };
      const extensionEnd = { x: from.x + outbound.x * 18 * scale, y: from.y + outbound.y * 18 * scale };
      drawLine(ctx, from, extensionEnd, 'rgba(110, 243, 176, 0.34)', 1, [7, 6]);
      for (const ringNm of [3, 6, 9, 12, 15]) {
        const tick = { x: from.x + outbound.x * ringNm * scale, y: from.y + outbound.y * ringNm * scale };
        const perpendicular = { x: outbound.y * 4, y: -outbound.x * 4 };
        drawLine(ctx, { x: tick.x - perpendicular.x, y: tick.y - perpendicular.y }, { x: tick.x + perpendicular.x, y: tick.y + perpendicular.y }, 'rgba(110, 243, 176, 0.34)');
      }
    }
    ctx.fillStyle = color;
    ctx.font = '700 13px IBM Plex Mono, ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(runway.id, to.x, to.y - 7);
    ctx.fillText(runway.reciprocal, from.x, from.y + 13);
  }

  for (const fix of world.fixes) {
    const point = worldToScreen(fix.position, viewport);
    ctx.strokeStyle = 'rgba(93, 190, 147, 0.6)';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - 4);
    ctx.lineTo(point.x + 4, point.y + 3);
    ctx.lineTo(point.x - 4, point.y + 3);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(125, 214, 173, 0.62)';
    ctx.textAlign = 'left';
    ctx.font = '11px IBM Plex Mono, ui-monospace, monospace';
    ctx.fillText(fix.label ?? fix.id, point.x + 7, point.y + 3);
  }

  for (const conflict of conflicts) {
    const first = aircraft.find((item) => item.callsign === conflict.pair[0]);
    const second = aircraft.find((item) => item.callsign === conflict.pair[1]);
    if (!first || !second) continue;
    drawLine(
      ctx,
      worldToScreen(first.position, viewport),
      worldToScreen(second.position, viewport),
      conflict.reason === 'wake' ? '#ff8f4f' : conflict.severity === 'loss' ? '#ff5d5d' : '#ffb648',
      conflict.severity === 'loss' ? 2 : 1,
      [4, 4],
    );
  }

  labelBoxes.clear();
  const renderAircraft = [...aircraft].sort((first, second) => Number(first.callsign === selectedCallsign) - Number(second.callsign === selectedCallsign));
  for (const item of renderAircraft) {
    const point = worldToScreen(item.position, viewport);
    const selected = selectedCallsign === item.callsign;
    const conflict = conflictFor(item.callsign, conflicts);
    const color = conflict?.severity === 'loss' ? '#ff5d5d' : conflict ? '#ffb648' : item.priority ? '#ffb648' : selected ? '#ffffff' : item.phase === 'arrival' ? '#67e8c4' : '#79b9ff';
    const arrival = arrivalPlan.get(item.callsign);
    const trackRadians = item.track * Math.PI / 180;
    const pendingReadback = pendingCallsigns.includes(item.callsign);

    const trail = trackHistory[item.callsign] ?? [];
    if (trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = selected ? 'rgba(255,255,255,.42)' : `${color}44`;
      ctx.lineWidth = selected ? 1.3 : 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      trail.forEach((historyPoint, index) => {
        const screenPoint = worldToScreen(historyPoint, viewport);
        if (index === 0) ctx.moveTo(screenPoint.x, screenPoint.y);
        else ctx.lineTo(screenPoint.x, screenPoint.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    if (selected) {
      const predictor = predictAircraftPath(item, world, 60, 5);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.58)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      for (const predicted of predictor) {
        const screen = worldToScreen(predicted, viewport);
        ctx.lineTo(screen.x, screen.y);
      }
      ctx.stroke();
      ctx.restore();

      if (arrival && !item.approach) {
        const runway = world.runways.find((entry) => entry.id === arrival.runwayId);
        if (runway) {
          const radians = runway.heading * Math.PI / 180;
          const intercept = worldToScreen({
            x: runway.center.x - Math.sin(radians) * 9,
            y: runway.center.y + Math.cos(radians) * 9,
          }, viewport);
          drawLine(ctx, point, intercept, 'rgba(103,232,196,.72)', 1.5, [7, 5]);
          ctx.strokeStyle = 'rgba(103,232,196,.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(intercept.x, intercept.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#67e8c4';
          ctx.font = '700 11px IBM Plex Mono, ui-monospace, monospace';
          ctx.fillText(`FINAL ${arrival.runwayId}`, intercept.x + 10, intercept.y - 8);
        }
      }
    }

    if (item.approach && item.approach.status !== 'armed') {
      const required = requiredWakeSeparationNm(item, { wakeCategory: 'E' });
      const tail = {
        x: point.x - Math.sin(trackRadians) * required * scale,
        y: point.y + Math.cos(trackRadians) * required * scale,
      };
      drawLine(ctx, point, tail, 'rgba(255,143,79,.38)', 5, [2, 5]);
      ctx.strokeStyle = 'rgba(255,143,79,.48)';
      ctx.beginPath();
      ctx.arc(tail.x, tail.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawLine(ctx, point, { x: point.x + Math.sin(trackRadians) * 22, y: point.y - Math.cos(trackRadians) * 22 }, color);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selected ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (selected || conflict || pendingReadback) {
      ctx.strokeStyle = color;
      ctx.lineWidth = pendingReadback ? 2 : 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, selected ? 18 : 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    const trend = aircraftTrend(item);
    const trendSymbol = trend === 'climb' ? '↑' : trend === 'descend' ? '↓' : '—';
    const currentFlightLevel = String(Math.round(item.altitude / 100)).padStart(3, '0');
    const targetFlightLevel = String(Math.round(item.targetAltitude / 100)).padStart(3, '0');
    // On a phone, keeping every desktop-sized data block makes the tactical
    // picture unreadable. The selected or hazardous target stays expanded;
    // routine traffic gets an intentionally compact, still-readable label.
    const compactScope = viewport.width < 600;
    const expandedLabel = !compactScope || selected || Boolean(conflict) || pendingReadback;
    const boxWidth = expandedLabel ? (compactScope ? 154 : 174) : 116;
    const boxHeight = expandedLabel ? (conflict?.predicted ? 66 : arrival ? 56 : 43) : 34;
    const offset = labelOffsets[item.callsign] ?? { x: 15, y: -25 };
    const label = {
      x: Math.max(4, Math.min(width - boxWidth - 4, point.x + offset.x)),
      y: Math.max(17, Math.min(height - boxHeight + 9, point.y + offset.y)),
    };
    drawLine(ctx, point, label, color);
    ctx.fillStyle = selected ? 'rgba(1, 10, 7, .96)' : 'rgba(1, 10, 7, .9)';
    ctx.fillRect(label.x, label.y - 13, boxWidth, boxHeight);
    ctx.strokeStyle = `${color}66`;
    ctx.strokeRect(label.x, label.y - 13, boxWidth, boxHeight);
    labelBoxes.set(item.callsign, { callsign: item.callsign, x: label.x, y: label.y - 13, width: boxWidth, height: boxHeight });
    ctx.font = `${selected ? '800' : '700'} ${selected ? 14 : 12}px IBM Plex Mono, ui-monospace, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(`${item.callsign}  ${item.wakeCategory}`, label.x + 4, label.y - 2);
    ctx.fillText(`${currentFlightLevel}${trendSymbol}${targetFlightLevel}  ${Math.round(item.speed)}/${Math.round(item.groundSpeed)}`, label.x + 4, label.y + 10);
    if (!expandedLabel) continue;
    ctx.font = '700 11px IBM Plex Mono, ui-monospace, monospace';
    ctx.fillStyle = pendingReadback ? '#ffb648' : item.approach?.status === 'tower' ? '#8cffc5' : color;
    ctx.fillText(`${pendingReadback ? 'READBACK · ' : ''}${statusText(item)}`, label.x + 4, label.y + 21);
    if (arrival) {
      ctx.fillStyle = arrival.sequence === 1 ? '#67e8c4' : '#a7cabb';
      ctx.fillText(`QUEUE #${arrival.sequence} · ${arrival.runwayId} · ${Math.ceil(arrival.etaSeconds / 60)}m`, label.x + 4, label.y + 34);
    }
    if (conflict?.predicted) {
      ctx.fillStyle = '#ffb648';
      ctx.fillText(`CPA ${conflict.predicted.horizontalNm.toFixed(1)}NM / ${Math.round(conflict.predicted.timeSeconds)}s`, label.x + 4, label.y + (arrival ? 47 : 37));
    }
  }

  if (measurement) {
    const from = worldToScreen(measurement.from, viewport);
    const to = worldToScreen(measurement.to ?? measurement.from, viewport);
    drawLine(ctx, from, to, '#ffffff', 1, [4, 4]);
    if (measurement.to) {
      const distanceNm = Math.hypot(measurement.to.x - measurement.from.x, measurement.to.y - measurement.from.y);
      const bearing = (Math.atan2(measurement.to.x - measurement.from.x, -(measurement.to.y - measurement.from.y)) * 180 / Math.PI + 360) % 360;
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px IBM Plex Mono, ui-monospace, monospace';
      ctx.fillText(`${distanceNm.toFixed(1)}NM / ${String(Math.round(bearing)).padStart(3, '0')}°`, (from.x + to.x) / 2 + 5, (from.y + to.y) / 2 - 5);
    }
  }

  ctx.fillStyle = 'rgba(110, 243, 176, 0.45)';
  ctx.font = '11px IBM Plex Mono, ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`TACTICAL CHART · ${Math.round(Math.min(width, height) / scale / 2)}NM · ${world.airport} · GAME ONLY`, 14, height - 14);
}

export function RadarScope({ world, aircraft, conflicts, trackHistory, pendingCallsigns, selectedCallsign, coach, onSelect, onApplyCoach }: RadarScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const labelBoxes = useRef(new Map<string, LabelBox>());
  const dragRef = useRef<DragState>(null);
  const [viewportVersion, setViewportVersion] = useState(0);
  const [labelOffsets, setLabelOffsets] = useState<Record<string, Vector2>>({});
  const [measureMode, setMeasureMode] = useState(false);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const arrivalPlan = useMemo(() => arrivalAdvice(aircraft, world), [aircraft, world]);
  const arrivalQueues = useMemo<RunwayQueue[]>(() => {
    const grouped = new Map<string, { aircraft: Aircraft; advice: ArrivalAdvice }[]>();
    for (const item of aircraft) {
      const advice = arrivalPlan.get(item.callsign);
      if (!advice) continue;
      const queue = grouped.get(advice.runwayId) ?? [];
      queue.push({ aircraft: item, advice });
      grouped.set(advice.runwayId, queue);
    }
    return [...grouped.entries()]
      .map(([runwayId, entries]) => ({
        runwayId,
        entries: entries.sort((first, second) => first.advice.sequence - second.advice.sequence).slice(0, 3),
      }))
      .sort((first, second) => first.entries[0]!.advice.etaSeconds - second.entries[0]!.advice.etaSeconds);
  }, [aircraft, arrivalPlan]);
  const selectedAdvice = selectedCallsign ? arrivalPlan.get(selectedCallsign) : undefined;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext('2d');
    if (ctx) drawRadar(ctx, viewport, world, aircraft, conflicts, trackHistory, pendingCallsigns, selectedCallsign, arrivalPlan, labelOffsets, labelBoxes.current, measurement);
  }, [aircraft, arrivalPlan, conflicts, labelOffsets, measurement, pendingCallsigns, selectedCallsign, trackHistory, world]);

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
      const previous = viewportRef.current;
      viewportRef.current = {
        width: rect.width,
        height: rect.height,
        scale: previous?.scale ?? initialScale(rect.width, rect.height, world.rangeNm),
        centerWorld: previous?.centerWorld ?? { x: 0, y: 0 },
      };
      setViewportVersion((value) => value + 1);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world.rangeNm]);

  useEffect(redraw, [redraw, viewportVersion]);

  const zoom = useCallback((factor: number, anchor?: Vector2) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const screenAnchor = anchor ?? { x: viewport.width / 2, y: viewport.height / 2 };
    const worldAnchor = screenToWorld(screenAnchor, viewport);
    const scale = Math.max(4, Math.min(42, viewport.scale * factor));
    const centerWorld = {
      x: worldAnchor.x - (screenAnchor.x - viewport.width / 2) / scale,
      y: worldAnchor.y - (screenAnchor.y - viewport.height / 2) / scale,
    };
    viewportRef.current = { ...viewport, scale, centerWorld };
    setViewportVersion((value) => value + 1);
  }, []);

  const resetView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewportRef.current = { ...viewport, scale: initialScale(viewport.width, viewport.height, world.rangeNm), centerWorld: { x: 0, y: 0 } };
    setMeasurement(null);
    setViewportVersion((value) => value + 1);
  }, [world.rangeNm]);

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pointer = pointerPosition(event);
    if (measureMode) {
      const worldPoint = screenToWorld(pointer, viewport);
      setMeasurement((current) => !current || current.to ? { from: worldPoint } : { ...current, to: worldPoint });
      return;
    }
    let closest: { callsign: string; distance: number } | null = null;
    const hitRadius = event.pointerType === 'touch' ? 44 : 28;
    for (const item of aircraft) {
      const point = worldToScreen(item.position, viewport);
      const hitDistance = Math.hypot(pointer.x - point.x, pointer.y - point.y);
      if (hitDistance <= hitRadius && (!closest || hitDistance < closest.distance)) closest = { callsign: item.callsign, distance: hitDistance };
    }
    if (closest) {
      onSelect(closest.callsign);
      return;
    }
    const label = [...labelBoxes.current.values()].reverse().find((box) => pointer.x >= box.x && pointer.x <= box.x + box.width && pointer.y >= box.y && pointer.y <= box.y + box.height);
    if (label) {
      onSelect(label.callsign);
      // A tap on a datablock is a selection on touch devices. Reserving label
      // dragging for mouse/pen input prevents a tiny finger movement from
      // moving a label instead of selecting the intended aircraft.
      if (event.pointerType === 'touch') return;
      dragRef.current = { kind: 'label', pointerId: event.pointerId, callsign: label.callsign, last: pointer };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    dragRef.current = { kind: 'pan', pointerId: event.pointerId, last: pointer };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [aircraft, measureMode, onSelect]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const viewport = viewportRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !viewport) return;
    const pointer = pointerPosition(event);
    const delta = { x: pointer.x - drag.last.x, y: pointer.y - drag.last.y };
    if (drag.kind === 'label') {
      setLabelOffsets((current) => {
        const existing = current[drag.callsign] ?? { x: 15, y: -25 };
        return { ...current, [drag.callsign]: { x: existing.x + delta.x, y: existing.y + delta.y } };
      });
    } else {
      viewportRef.current = {
        ...viewport,
        centerWorld: {
          x: viewport.centerWorld.x - delta.x / viewport.scale,
          y: viewport.centerWorld.y - delta.y / viewport.scale,
        },
      };
      setViewportVersion((value) => value + 1);
    }
    dragRef.current = { ...drag, last: pointer };
  }, []);

  const endDrag = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    zoom(event.deltaY < 0 ? 1.12 : 0.89, { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, [zoom]);

  return (
    <div className="radar-frame" aria-label="Yaklaşma radar ekranı">
      <div className="scope-corner scope-corner--top-left" />
      <div className="scope-corner scope-corner--bottom-right" />
      <div className="radar-tools" aria-label="Radar görünüm araçları">
        <button type="button" onClick={() => zoom(1.18)} aria-label="Yakınlaştır">＋</button>
        <button type="button" onClick={() => zoom(0.84)} aria-label="Uzaklaştır">−</button>
        <button type="button" onClick={resetView}>LOCK</button>
        <button type="button" className={measureMode ? 'is-active' : ''} onClick={() => { setMeasureMode((current) => !current); setMeasurement(null); }}>RANGE</button>
      </div>
      {arrivalQueues.length > 0 ? (
        <div className="radar-queue" aria-label="Yaklaşma sırası">
          <span className="radar-queue__heading">PİST BAZLI YAKLAŞMA SIRASI</span>
          <div className="radar-queue__runways">
            {arrivalQueues.map(({ runwayId, entries }) => (
              <section className="radar-queue__runway" key={runwayId} aria-label={`${runwayId} yaklaşma sırası`}>
                <strong>{runwayId}</strong>
                <div className="radar-queue__items">
                  {entries.map(({ aircraft: queuedAircraft, advice }) => (
                    <button key={queuedAircraft.callsign} type="button" className={queuedAircraft.callsign === selectedCallsign ? 'is-selected' : ''} onClick={() => onSelect(queuedAircraft.callsign)}>
                      <b>#{advice.sequence}</b> {queuedAircraft.callsign} <small>{Math.ceil(advice.etaSeconds / 60)}m{advice.spacingRisk ? ' · WAKE' : ''}</small>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
      {selectedAdvice ? (
        <div className={`radar-decision radar-decision--${coach.tone}`} aria-live="polite">
          <span>SONRAKİ İŞ</span>
          <strong>{selectedCallsign} · #{selectedAdvice.sequence} · {selectedAdvice.runwayId}</strong>
          <small>Final {Math.round(selectedAdvice.distanceNm)} NM · ETA {Math.ceil(selectedAdvice.etaSeconds / 60)} dk · H{String(selectedAdvice.recommendedHeading).padStart(3, '0')} · FL{String(Math.round(selectedAdvice.recommendedAltitude / 100)).padStart(3, '0')}</small>
          {coach.callsign === selectedCallsign && coach.command ? <button type="button" onClick={() => onApplyCoach(coach)}>{coach.command} UYGULA</button> : null}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className="radar-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
        onDoubleClick={resetView}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Uçak seçmek için hedefe dokun. Boş alanda sürükleyerek radarı kaydır; iki kez dokunarak görünümü sıfırla."
      />
    </div>
  );
}
