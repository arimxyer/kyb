import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh tracked candidate sources",
  { hours: 1 },
  internal.ingestion.refreshTrackedSources,
  { limit: 20 },
);

export default crons;
