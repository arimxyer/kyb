# Production release setup

The protected production workflow completed its first release on 2026-07-25.
It is intentionally inactive again: `KYB_PRODUCTION_RELEASE_ENABLED` is unset,
and the temporary Cloudflare OAuth credential used for the bootstrap release
has been removed from GitHub.

## Publication decision

The repository is public. Public visibility provides the branch and environment
controls needed by the solo-maintainer release policy on the current GitHub
plan.

The following checks were completed before changing visibility:

1. scan all reachable Git history for credentials;
2. inspect retired hosting and authentication files;
3. ensure commit metadata does not expose a private author email;
4. push only after the sanitized history is verified.

References:

- <https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments>
- <https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments>

## Branch preview prerequisite

Add the repository Actions secret `CONVEX_PREVIEW_DEPLOY_KEY` using a
preview-scoped Convex deploy key. Same-repository pull requests then create a
disposable Convex preview, seed the prototype fixture, build the Worker against
that preview, and run the browser smoke test. Fork pull requests never receive
the secret and do not run this job.

## Protected production environment

The `production` environment uses:

- administrator bypass disabled;
- deployment restricted to `main`;
- environment secret `CONVEX_DEPLOY_KEY`, scoped to the existing production
  Convex deployment;
- environment secret `CLOUDFLARE_ACCOUNT_ID`;
- environment secret `CLOUDFLARE_API_TOKEN`, with only the account permissions
  needed to inspect, upload, and deploy this Worker;
- environment variable `NEXT_PUBLIC_CONVEX_URL` set to
  `https://warmhearted-raccoon-48.convex.cloud`;
- environment variable `KYB_PRODUCTION_URL` set to the public HTTPS origin
  that will receive the promoted Worker;
- environment variable `KYB_PRODUCTION_ENVIRONMENT_PROTECTED` set to `1`.

Configure required `main` checks and block direct pushes. The `Validate`
workflow must pass for the exact release commit.

During the solo-maintainer phase, the manual workflow dispatch and exact typed
confirmation are the intentional approval action. Add a required reviewer and
disable self-review when another trusted maintainer joins; do not invent a
second identity merely to satisfy ceremony.

Set repository variable `KYB_PRODUCTION_RELEASE_ENABLED=1` last. It is the
outer activation latch; the environment protection and environment-scoped
credentials remain the actual production boundary.

The durable `CLOUDFLARE_API_TOKEN` is the only missing credential after the
first release. Create an account-owned token named `kyb-github-production`,
scope it to this Cloudflare account, and grant only `Workers Scripts: Edit`.
Store it in the `production` environment, then enable the repository latch
immediately before the next approved release. Do not reuse or export the local
Wrangler OAuth credential.

## First production release receipt

- Date: 2026-07-25
- Commit:
  `3cb3a7893516fb14e3bbd069bedd1e92e38dfd4f`
- Preview workflow:
  <https://github.com/arimxyer/kyb/actions/runs/30137037640>
- Production workflow:
  <https://github.com/arimxyer/kyb/actions/runs/30137092041>
- Convex target: `https://warmhearted-raccoon-48.convex.cloud`
- Worker version: `8492f9d4-1444-4774-9f73-90776b44a9fd`
- Immutable candidate:
  <https://8492f9d4-know-your-ballot.ari111097.workers.dev>
- Candidate alias:
  <https://candidate-know-your-ballot.ari111097.workers.dev>
- Production:
  <https://know-your-ballot.ari111097.workers.dev>
- Cloudflare deployment: version above at 100 percent, deployment message
  `release-3cb3a7893516fb14e3bbd069bedd1e92e38dfd4f`
- Workflow verification: complete validation, Convex deploy, candidate test,
  exact-version promotion, and promoted-production test passed.
- Independent verification: production returned HTTP 200 with the title
  `Know Your Ballot`; a fresh remote Chromium voter-journey smoke test passed
  in 3.1 seconds.
- Observation: the candidate test's first attempt encountered a transient 404
  while the preview alias propagated. Its configured retry passed, the
  promoted-production test passed, and the independent post-release run passed
  without retry.
- Credential cleanup: the temporary local Wrangler OAuth credential was
  removed from GitHub immediately after verification, and the repository
  release latch was unset.

## Release behavior

Run `Release production` from `main` and enter the exact confirmation
`release production`.

The workflow:

1. reruns the complete validation workflow for the exact commit;
2. enters the branch-restricted `production` environment;
3. verifies the ref, commit, target URLs, activation flags, and credential
   presence without printing secrets;
4. asks the Convex CLI to inject the deployment-key target URL and verifies it
   is the known production deployment before deploying functions;
5. builds OpenNext with that production URL;
6. on the first release only, creates a 503 maintenance Worker so unverified
   application code never becomes the first live version;
7. uploads an immutable Worker version tagged with the commit SHA;
8. extracts the exact version ID and aliased preview URL from Wrangler's
   structured output;
9. runs the browser smoke test through Cloudflare against that candidate;
10. promotes that exact version to 100 percent traffic;
11. repeats the browser smoke test at the configured production URL and writes
    a release receipt to the Actions summary.

Cloudflare preview URLs are explicitly enabled in `wrangler.jsonc`. Wrangler's
structured output is captured through `WRANGLER_OUTPUT_FILE_PATH`.

References:

- <https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/>
- <https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/>
- <https://developers.cloudflare.com/workers/wrangler/system-environment-variables/>

## Failure and rollback behavior

- A failure before the Convex step causes no production mutation.
- A failure after Convex deployment leaves the backward-compatible backend
  change in place and does not promote the Worker candidate.
- A failed first frontend release leaves the 503 maintenance Worker active.
- A failed later frontend release leaves the previous Worker deployment active.
- The uploaded Worker version ID in the Actions summary is the rollback handle.
  Use Cloudflare's version rollback/deployment controls through an approved
  production operation.

Convex schema evolution must remain additive, backfilled, and only then
tightened so the previously deployed frontend remains compatible throughout
this sequence.
