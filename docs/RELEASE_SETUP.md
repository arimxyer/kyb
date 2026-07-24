# Production release setup

The production workflow is committed but intentionally inactive. It has never
been run against production. Keep `KYB_PRODUCTION_RELEASE_ENABLED` unset until
every prerequisite below is complete.

## Current blocker

As checked on 2026-07-24, this repository is private and its current GitHub
plan does not permit the protected environment and branch configuration
required by `docs/ARCHITECTURE_DECISIONS.md`.

GitHub Free supports environments only for public repositories. GitHub Pro and
Team add private-repository environments and deployment branch rules, but
required reviewers and wait timers remain public-repository-only on Free, Pro,
and Team. A private repository therefore needs GitHub Enterprise for the
decision record's separate production approval gate.

Do not replace that gate with repository-level production secrets or set the
activation variable as a workaround. The acceptable paths are:

1. keep the repository private and move it to a GitHub plan that supports the
   required approval;
2. make the repository public if that is an intentional product decision; or
3. explicitly revise the architecture decision and adopt a comparably strong
   release control.

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

After the GitHub plan blocker is resolved, configure a `production`
environment with:

- a required reviewer other than the person starting the release;
- self-review disabled;
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

Set repository variable `KYB_PRODUCTION_RELEASE_ENABLED=1` last. It is the
outer activation latch; the environment protection and environment-scoped
credentials remain the actual production boundary.

## Release behavior

Run `Release production` from `main` and enter the exact confirmation
`release production`.

The workflow:

1. reruns the complete validation workflow for the exact commit;
2. waits at the protected `production` environment;
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
