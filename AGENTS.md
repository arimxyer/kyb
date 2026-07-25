# KYB agent instructions

This file is authoritative for agents working in this repository. Read
`docs/ARCHITECTURE_DECISIONS.md` before changing architecture, dependencies,
data flow, authentication, ingestion, AI behavior, or deployment.

## Product contract

Know Your Ballot (KYB) is an evidence-first voter-information product. It helps
people identify their ballot, compare candidates, inspect claims, and trace
every material statement to its source.

- Do not rank candidates, recommend a candidate, or create an opaque trust
  score.
- AI may retrieve, organize, compare, and explain evidence. It must not invent
  facts or independently judge candidates.
- Published claims remain source-linked.
- Changed or interpretive material must pass editorial review before
  publication.
- When evidence is insufficient or conflicting, say so plainly.
- Public product surfaces are read-only. Editorial writes require authenticated
  and authorized Convex functions.
- The initial product is a reliable, public, read-only aggregation and
  comparison surface. Do not make multi-user accounts or an editorial UI a
  prerequisite for launching and hardening that core.

## Decided architecture

- Public GitHub repository `arimxyer/kyb`, branch `main`, is the source of
  truth.
- Convex is the sole application backend and database.
- Drizzle, D1, `db/`, `drizzle/`, and the D1 example were obsolete
  scaffolding and have been removed. Do not reintroduce them.
- Local frontend plus local Convex is the default daily development lane.
- The existing Convex cloud development deployment is an integration-testing
  lane, not the default.
- Production is Cloudflare Workers plus the existing production Convex
  deployment.
- The frontend runs on Next.js for Cloudflare through
  `@opennextjs/cloudflare`.
- ChatGPT Sites and its authentication/build residue are retired and removed.
- GitHub Actions owns validation and production promotion.
- Convex Auth owns editor identity. Editor roles and authorization live in
  Convex when the editorial application surface is implemented.
- Bun is the sole package manager. Commit `bun.lock`; do not add npm, pnpm, or
  Yarn lockfiles.

## Environments

| Lane | Convex target | Purpose |
|---|---|---|
| Local default | Local Convex deployment | Daily development, schema work, destructive tests, fixtures |
| Integration | `https://sleek-snail-205.convex.cloud` | Cloud runtime, cron, webhook, and shared-state verification |
| Production | `https://warmhearted-raccoon-48.convex.cloud` | Real production data only |

Never point a local frontend at production. Never run `bunx convex deploy` as
part of ordinary development. Production changes must go through the protected
GitHub release workflow unless Ari explicitly requests an emergency manual
deployment.

## Current implementation state

The Bun migration, dependency refresh, architecture cleanup, OpenNext
migration, explicit development lanes, deterministic fixtures, CI validation,
browser coverage, preview lane, and protected production workflow are
complete. The sanitized repository is public and the first verified read-only
release is live at `https://know-your-ballot.ari111097.workers.dev`.

The next product boundary is source correctness, ingestion robustness,
freshness, observability, and coverage. The temporary Cloudflare credential
used to bootstrap the first release was removed afterward. Before the next
production release, add the durable account-owned token documented in
`docs/RELEASE_SETUP.md`, then enable the release latch last.

Oxlint is the linter, including type-aware rules and the experimental aggregate
React Compiler rule. TypeScript remains on `6.0.3`: the TypeScript 7 CLI passes,
but Next.js `16.2.11` cannot complete its production build with the TypeScript
7 package. Do not upgrade TypeScript until an actual Next and OpenNext build
proves framework support.

`convex/fixtures/prototype.ts` is a seed-only fixture used by
`convex/seed.ts`. It is not a second runtime data source.

Until the authenticated editorial surface exists, editorial state changes stay
backend-only as internal Convex operations performed by a trusted deployment
administrator. Do not expose an unauthenticated write path as a shortcut.

## Convex rules

- Read `convex/schema.ts` before editing the backend.
- Use object-form functions with `args` and `returns` validators.
- Default backend-only work to internal functions.
- Use indexes and bounded reads; do not add unbounded `.collect()` calls.
- Derive editor identity from auth context. Do not accept actor names, user IDs,
  roles, or permissions from the client.
- Use additive optional fields, backfill, then tighten when evolving populated
  production tables.
- Run `bunx tsc --noEmit` and push to a local Convex deployment before declaring
  backend work complete.

## Planned Convex components

The following components passed the product-fit reasoning stage and are planned
building blocks: Workflow, Workpool, Action Cache, Rate Limiter, Cloudflare R2,
RAG, and Agent.

Their absence from `package.json` means “not implemented yet,” not “rejected.”
Adopt each at its documented milestone. Reject or replace one only after an
actual project test demonstrates a concrete mismatch, and record that evidence
in `docs/ARCHITECTURE_DECISIONS.md`.

Do not install all components in one dependency-only change. Install each with
the feature that exercises it and its acceptance tests.

## Required implementation order

0. Completed: use Bun and upgrade retained dependencies to their latest
   mutually compatible stable versions.
1. Completed: remove Sites/D1/Drizzle residue and migrate the frontend build to
   OpenNext.
2. Completed: add local, cloud-integration, and Worker-preview commands plus
   production target guards.
3. Completed: add GitHub validation, preview deployments, and guarded
   production promotion.
4. Completed: launch and verify the public read-only pilot.
5. Harden source ingestion, data correctness, freshness, observability, and
   backend-only review operations.
6. Expand address matching and election coverage.
7. Implement Convex Auth and authenticated multi-user editorial controls.
8. Build evidence-grounded AI Q&A with RAG and Agent.

Do not begin AI Q&A before the authenticated review workflow and evidence
retrieval boundaries are tested.
