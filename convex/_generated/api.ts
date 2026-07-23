/* eslint-disable */
/**
 * Generated utilities for referencing Convex functions.
 *
 * Regenerate with `npx convex dev` after the project is linked.
 */

import { anyApi } from "convex/server";
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as candidates from "../candidates.js";
import type * as evidence from "../evidence.js";
import type * as finance from "../finance.js";
import type * as health from "../health.js";
import type * as races from "../races.js";
import type * as records from "../records.js";
import type * as sourceRefreshes from "../sourceRefreshes.js";

const fullApi: ApiFromModules<{
  candidates: typeof candidates;
  evidence: typeof evidence;
  finance: typeof finance;
  health: typeof health;
  races: typeof races;
  records: typeof records;
  sourceRefreshes: typeof sourceRefreshes;
}> = anyApi as any;

export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;
