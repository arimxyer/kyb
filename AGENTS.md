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

## Decided architecture

- GitHub `arimxyer/kyb`, branch `main`, is the source of truth.
- Convex is the sole application backend and database.
- Drizzle, D1, `db/`, `drizzle/`, and the D1 example are obsolete scaffolding.
  Remove them; do not preserve or expand them.
- Local frontend plus local Convex is the default daily development lane.
- The existing Convex cloud development deployment is an integration-testing
  lane, not the default.
- Production is Cloudflare Workers plus the existing production Convex
  deployment.
- The frontend will migrate from the Sites/vinext build to Next.js on
  Cloudflare through `@opennextjs/cloudflare`.
- ChatGPT Sites and its authentication/build residue are superseded.
- GitHub Actions owns validation and production promotion.
- Convex Auth owns editor identity. Editor roles and authorization live in
  Convex.

## Environments

| Lane | Convex target | Purpose |
|---|---|---|
| Local default | Local Convex deployment | Daily development, schema work, destructive tests, fixtures |
| Integration | `https://sleek-snail-205.convex.cloud` | Cloud runtime, cron, webhook, and shared-state verification |
| Production | `https://warmhearted-raccoon-48.convex.cloud` | Real production data only |

Never point a local frontend at production. Never run `npx convex deploy` as
part of ordinary development. Production changes must go through the protected
GitHub release workflow unless Ari explicitly requests an emergency manual
deployment.

## Current transitional state

The repository still contains a working Sites/vinext frontend path and unused
D1/Drizzle starter files. This is known technical residue, not intended
architecture. Do not mistake the current package manifest for the target state.

The first implementation milestone is the architecture cleanup and OpenNext
migration described in the decision record. Preserve behavior while removing
the obsolete layers.

`lib/voter-data.ts` is a prototype seed fixture used by `convex/seed.ts`; move
it to an explicitly named Convex fixture during cleanup. It is not a second
runtime data source.

## Convex rules

- Read `convex/schema.ts` before editing the backend.
- Use object-form functions with `args` and `returns` validators.
- Default backend-only work to internal functions.
- Use indexes and bounded reads; do not add unbounded `.collect()` calls.
- Derive editor identity from auth context. Do not accept actor names, user IDs,
  roles, or permissions from the client.
- Use additive optional fields, backfill, then tighten when evolving populated
  production tables.
- Run `npx tsc --noEmit` and push to a local Convex deployment before declaring
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

1. Remove Sites/D1/Drizzle residue and migrate the frontend build to OpenNext.
2. Add local, cloud-integration, and Worker-preview commands plus production
   target guards.
3. Add GitHub validation and protected production deployment.
4. Implement Convex Auth and authenticated editorial controls.
5. Adopt the ingestion components in the sequence defined by the decision
   record.
6. Build evidence-grounded AI Q&A with RAG and Agent.
7. Expand address matching and election coverage.

Do not begin AI Q&A before the authenticated review workflow and evidence
retrieval boundaries are tested.

