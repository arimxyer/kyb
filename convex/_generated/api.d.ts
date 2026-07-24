/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ballot from "../ballot.js";
import type * as candidates from "../candidates.js";
import type * as crons from "../crons.js";
import type * as evidence from "../evidence.js";
import type * as finance from "../finance.js";
import type * as health from "../health.js";
import type * as ingestion from "../ingestion.js";
import type * as ingestionData from "../ingestionData.js";
import type * as races from "../races.js";
import type * as records from "../records.js";
import type * as review from "../review.js";
import type * as seed from "../seed.js";
import type * as sourceRefreshes from "../sourceRefreshes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ballot: typeof ballot;
  candidates: typeof candidates;
  crons: typeof crons;
  evidence: typeof evidence;
  finance: typeof finance;
  health: typeof health;
  ingestion: typeof ingestion;
  ingestionData: typeof ingestionData;
  races: typeof races;
  records: typeof records;
  review: typeof review;
  seed: typeof seed;
  sourceRefreshes: typeof sourceRefreshes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
