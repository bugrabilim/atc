import type { RadarWorld, Runway } from './types';

function signedAngleDifference(first: number, second: number) {
  return ((first - second + 540) % 360) - 180;
}

export function activeFlowWeather(world: RadarWorld) {
  return world.flowConfigurations.find((item) => item.id === world.activeFlowId) ?? world.flowConfigurations[0];
}

export function runwayWindComponents(world: RadarWorld, runway: Runway) {
  const flow = activeFlowWeather(world);
  if (!flow) return { headwindKt: 0, crosswindKt: 0 };
  const radians = (signedAngleDifference(flow.windDirection, runway.heading) * Math.PI) / 180;
  return {
    headwindKt: Math.round(flow.windSpeedKt * Math.cos(radians)),
    crosswindKt: Math.round(Math.abs(flow.windSpeedKt * Math.sin(radians))),
  };
}

export function approachLateralToleranceNm(world: RadarWorld, runway: Runway) {
  return Math.max(1.15, 2.2 - runwayWindComponents(world, runway).crosswindKt * 0.04);
}

export function stabilizedApproachSpeedKt(world: RadarWorld, runway: Runway, minimumSpeed: number) {
  const wind = runwayWindComponents(world, runway);
  const windAdditive = Math.min(15, Math.max(0, Math.round(wind.crosswindKt * 0.45 - wind.headwindKt * 0.15)));
  return Math.max(minimumSpeed + 5, 145 + windAdditive);
}
