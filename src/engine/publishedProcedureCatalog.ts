import {
  FLAGSHIP_AIRPORT_OPERATIONS,
  type PublishedProcedurePack,
} from './airportOperations';
import { FAA_CIFP_PROCEDURE_PACKS } from './generated/faaCifpProcedures';
import { INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS } from './internationalPublishedProcedures';
import type { ScenarioId } from './types';

export const PUBLISHED_PROCEDURE_PACKS: PublishedProcedurePack[] = [
  ...FLAGSHIP_AIRPORT_OPERATIONS,
  ...FAA_CIFP_PROCEDURE_PACKS,
  ...INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS,
];

export const publishedProcedurePackByAirportId = new Map<ScenarioId, PublishedProcedurePack>(
  PUBLISHED_PROCEDURE_PACKS.map((pack) => [pack.airportId, pack]),
);
