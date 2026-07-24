# Know Your Ballot

Know Your Ballot (KYB) is an evidence-first voter-information application. It
helps voters identify relevant races, compare candidates across consistent
categories, inspect the public record, and open the source behind every
material claim.

The current product is an NY-04 / ZIP 11557 pilot backed by production Convex
data. It includes candidate profiles, race comparison, claims and evidence,
office history, campaign-finance summaries, endorsements, source freshness,
change detection, and a private review-state foundation.

## Product rules

- No candidate rankings, recommendations, or opaque trust scores.
- Published claims remain connected to sources.
- Changed or interpretive material requires editorial review.
- AI may retrieve and explain evidence; it must cite sources and abstain when
  support is insufficient.

## Architecture direction

- **Frontend:** Next.js on Cloudflare Workers through OpenNext.
- **Backend:** Convex only.
- **Daily development:** local frontend plus local Convex.
- **Integration testing:** the existing cloud Convex development deployment.
- **Production:** Cloudflare Workers plus production Convex.
- **Source and releases:** GitHub with protected CI/CD.
- **Editor identity:** Convex Auth and Convex-hosted role authorization.

The repository now uses the target frontend and data architecture: standard
Next.js builds, OpenNext Worker bundles, and Convex as the sole backend. The
former Sites/vinext and D1/Drizzle paths have been removed.

Read [AGENTS.md](./AGENTS.md) and
[the architecture decision record](./docs/ARCHITECTURE_DECISIONS.md) before
starting work.

## Convex environments

| Lane | Target |
|---|---|
| Local default | Local Convex deployment |
| Cloud integration | `https://sleek-snail-205.convex.cloud` |
| Production | `https://warmhearted-raccoon-48.convex.cloud` |

Never point local development at production.

## Local setup

Prerequisites:

- Node.js `>=22.13.0`
- Bun `1.3.14`
- Convex CLI through the repository dependency

Install:

```bash
bun install --frozen-lockfile
cp .env.example .env.local
```

Create and select a local Convex deployment the first time:

```bash
bunx convex deployment create local --select
```

If the local deployment already exists:

```bash
bunx convex deployment select local
```

Keep the local backend running in one terminal:

```bash
bunx convex dev
```

Seed a new local deployment once, from another terminal:

```bash
bunx convex run seed:prototype
```

Start the frontend in a second long-running terminal:

```bash
bun run dev
```

`bun run dev` uses `next dev` and refuses to start unless
`NEXT_PUBLIC_CONVEX_URL` selects a local Convex deployment.

To exercise the production-style Worker runtime while local Convex remains
running:

```bash
bun run preview
```

## Cloud integration lane

Use the cloud development deployment only when testing hosted cron behavior,
public callbacks, shared state, or other cloud-only behavior:

```bash
bunx convex deployment select dev
bunx convex dev
```

In a second terminal:

```bash
bun run dev:integration
```

For the OpenNext Worker runtime against integration Convex:

```bash
bun run preview:integration
```

Return to local mode afterward:

```bash
bunx convex deployment select local
```

## Current validation

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
bun run build
bun run build:worker
bun run test:e2e:local
bun run test:e2e:worker
```

Linting uses Oxlint `1.75.0` with its correctness category, migrated Next.js,
React, import, and accessibility rules, type-aware checks through
`oxlint-tsgolint`, and warnings treated as failures. TypeScript is held at
`6.0.3` because Next.js `16.2.11` cannot complete its production build with the
TypeScript 7 package.

GitHub Actions now runs frozen installs, static validation, local-Convex
Playwright flows, Next.js and OpenNext builds, and Worker-runtime smoke tests.

## Production safety

`bunx convex deploy` targets production. Do not run it during ordinary
development. Production promotion will be owned by a protected GitHub
environment that deploys Convex, builds against the production Convex URL, and
then deploys the exact tested frontend commit to Cloudflare.

`bun run deploy:production` is intentionally unusable from an ordinary local
shell. It requires the exact production Convex URL, GitHub Actions, CI, and the
protected release flag.

Never commit:

- `.env.local`
- Convex deploy/admin keys
- Cloudflare API tokens
- OAuth client secrets

## Next milestone

The next implementation boundary is protected promotion:

1. Add branch-preview behavior for backend changes that need hosted testing.
2. Configure protected GitHub preview and production environments with
   least-privilege credentials.
3. Verify a release candidate, deploy Convex first, then promote the exact
   tested OpenNext artifact.

Convex Auth and authenticated editorial controls follow that release
foundation.
