import { approachGeometry } from './approach';
import { moveToward, normalizeHeading, shortestTurnDelta } from './math';
import { activeFlowWeather } from './weather';
import type { Aircraft, RadarWorld, Vector2 } from './types';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const STANDARD_TURN_CONSTANT = 1091;

function directedTurnDelta(aircraft: Aircraft) {
  let delta = shortestTurnDelta(aircraft.heading, aircraft.targetHeading);
  if (aircraft.turnDirection === 'left' && delta > 0) delta -= 360;
  if (aircraft.turnDirection === 'right' && delta < 0) delta += 360;
  return delta;
}

export function normalSpeedTarget(aircraft: Aircraft, world: RadarWorld) {
  if (aircraft.approach) {
    const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
    const distanceToThreshold = runway ? approachGeometry(aircraft, runway).distanceToThreshold : 20;
    if (aircraft.approach.status === 'tower' || distanceToThreshold <= 4) return aircraft.performance.finalApproachSpeed;
    if (distanceToThreshold <= 6) return Math.max(160, aircraft.performance.finalApproachSpeed + 8);
    if (aircraft.approach.status === 'glideslope' || aircraft.approach.status === 'localizer') return 200;
  }
  const distanceToAirport = Math.hypot(aircraft.position.x, aircraft.position.y);
  if (aircraft.phase === 'arrival' && distanceToAirport <= 15) return 220;
  if (aircraft.altitude < 10000) return 250;
  return aircraft.phase === 'arrival' ? 285 : 300;
}

function windVelocity(world: RadarWorld): Vector2 {
  const flow = activeFlowWeather(world);
  if (!flow) return { x: 0, y: 0 };
  const towardHeading = normalizeHeading(flow.windDirection + 180);
  const radians = towardHeading * Math.PI / 180;
  return {
    x: Math.sin(radians) * flow.windSpeedKt,
    y: -Math.cos(radians) * flow.windSpeedKt,
  };
}

export function stepAircraftDynamics(aircraft: Aircraft, world: RadarWorld, dt: number): Aircraft {
  const normalTarget = normalSpeedTarget(aircraft, world);
  const targetSpeed = aircraft.speedMode === 'normal' ? normalTarget : aircraft.targetSpeed;
  const speedStep = aircraft.performance.accelerationKtPerSecond * dt;
  const speed = moveToward(aircraft.speed, targetSpeed, speedStep);
  const trueAirspeed = speed * (1 + Math.max(0, aircraft.altitude) * 0.000018);

  const turnDelta = directedTurnDelta(aircraft);
  const desiredBank = Math.abs(turnDelta) < 0.35
    ? 0
    : Math.sign(turnDelta) * Math.min(aircraft.performance.maxBankDeg, Math.max(7, Math.abs(turnDelta) * 0.58));
  const bankAngle = moveToward(
    aircraft.bankAngle,
    desiredBank,
    aircraft.performance.rollRateDegPerSecond * dt,
  );
  const turnRate = STANDARD_TURN_CONSTANT * Math.tan(Math.abs(bankAngle) * Math.PI / 180) / Math.max(90, trueAirspeed);
  const turnStep = Math.min(Math.abs(turnDelta), turnRate * dt) * Math.sign(bankAngle || turnDelta);
  const heading = normalizeHeading(aircraft.heading + turnStep);

  const altitudeDelta = aircraft.targetAltitude - aircraft.altitude;
  const baseVerticalRate = altitudeDelta > 50
    ? aircraft.performance.climbRateFpm
    : altitudeDelta < -50
      ? -aircraft.performance.descentRateFpm
      : 0;
  const desiredVerticalRate = baseVerticalRate * (aircraft.expedite ? 1.45 : 1);
  let verticalSpeed = moveToward(aircraft.verticalSpeed, desiredVerticalRate, 700 * dt);
  let altitude = aircraft.altitude + verticalSpeed / SECONDS_PER_MINUTE * dt;
  let expedite = aircraft.expedite;
  if ((altitudeDelta >= 0 && altitude >= aircraft.targetAltitude) || (altitudeDelta < 0 && altitude <= aircraft.targetAltitude) || Math.abs(altitudeDelta) <= 50) {
    altitude = aircraft.targetAltitude;
    verticalSpeed = 0;
    expedite = false;
  }

  const airRadians = heading * Math.PI / 180;
  const airVelocity = {
    x: Math.sin(airRadians) * trueAirspeed,
    y: -Math.cos(airRadians) * trueAirspeed,
  };
  const wind = windVelocity(world);
  const groundVelocity = { x: airVelocity.x + wind.x, y: airVelocity.y + wind.y };
  const groundSpeed = Math.hypot(groundVelocity.x, groundVelocity.y);
  const track = normalizeHeading(Math.atan2(groundVelocity.x, -groundVelocity.y) * 180 / Math.PI);
  const position = {
    x: aircraft.position.x + groundVelocity.x * dt / SECONDS_PER_HOUR,
    y: aircraft.position.y + groundVelocity.y * dt / SECONDS_PER_HOUR,
  };

  return {
    ...aircraft,
    heading,
    altitude,
    speed,
    targetSpeed,
    groundSpeed,
    track,
    bankAngle,
    verticalSpeed,
    expedite,
    position,
  };
}

export function predictAircraftPath(aircraft: Aircraft, world: RadarWorld, seconds = 60, sampleEverySeconds = 5) {
  const points: Vector2[] = [];
  let predicted = { ...aircraft, position: { ...aircraft.position } };
  for (let second = 1; second <= seconds; second += 1) {
    predicted = stepAircraftDynamics(predicted, world, 1);
    if (second % sampleEverySeconds === 0) points.push({ ...predicted.position });
  }
  return points;
}

