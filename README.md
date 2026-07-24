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

The repository is in a short transition. It still contains a working
Sites/vinext build and unused D1/Drizzle starter residue. Those files are
explicitly superseded and are the first cleanup milestone; they are not part of
the intended architecture.

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
- npm
- Convex CLI through the repository dependency

Install:

```bash
npm ci
cp .env.example .env.local
```

Create and select a local Convex deployment the first time:

```bash
npx convex deployment create local --select
npx convex dev
```

If the local deployment already exists:

```bash
npx convex deployment select local
npx convex dev
```

In a second terminal, start the current frontend:

```bash
npm run dev
```

The first architecture-cleanup milestone will change the frontend command from
the current vinext/Vite implementation to standard `next dev` and will add an
OpenNext Worker-preview command.

## Cloud integration lane

Use the cloud development deployment only when testing hosted cron behavior,
public callbacks, shared state, or other cloud-only behavior:

```bash
npx convex deployment select dev
npx convex dev
```

Return to local mode afterward:

```bash
npx convex deployment select local
```

## Current validation

Until the OpenNext cleanup lands, the checked-in validation commands are:

```bash
npx tsc --noEmit
npm run lint
npm test
```

The target GitHub workflow adds local-Convex backend tests, browser tests,
OpenNext production builds, and Worker-runtime smoke tests.

## Production safety

`npx convex deploy` targets production. Do not run it during ordinary
development. Production promotion will be owned by a protected GitHub
environment that deploys Convex, builds against the production Convex URL, and
then deploys the exact tested frontend commit to Cloudflare.

Never commit:

- `.env.local`
- Convex deploy/admin keys
- Cloudflare API tokens
- OAuth client secrets

## Next milestone

The next local agent starts with architecture cleanup and OpenNext migration:

1. Upgrade Next.js to a patched OpenNext-supported release.
2. Remove D1, Drizzle, ChatGPT Sites, and vinext-only residue.
3. Move the prototype data into an explicit Convex fixture.
4. Add local, integration, Worker-preview, and guarded production commands.
5. Preserve and browser-test every current route.

Authenticated editorial controls come immediately after that foundation.
