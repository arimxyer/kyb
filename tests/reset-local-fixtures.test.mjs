import assert from "node:assert/strict";
import { test } from "node:test";

import { resetLocalFixtures } from "../scripts/reset-local-fixtures.mjs";

const localEnv = {
  NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3210",
};

test("resets in bounded batches before seeding a fresh local fixture", () => {
  const calls = [];
  const results = [
    {
      status: "reset-batch",
      table: "claims",
      deleted: 19,
      done: false,
    },
    {
      status: "reset-batch",
      table: null,
      deleted: 0,
      done: true,
    },
    {
      status: "seeded",
      elections: 1,
      races: 1,
      candidates: 3,
      sources: 11,
      claims: 19,
      officeTerms: 3,
      endorsements: 2,
      financeReports: 2,
    },
  ];

  const result = resetLocalFixtures({
    env: localEnv,
    invoke(functionName, args, options) {
      calls.push({
        functionName,
        args,
        agentMode: options.env.CONVEX_AGENT_MODE,
      });
      return results.shift();
    },
  });

  assert.equal(result.status, "ready");
  assert.equal(result.documentsDeleted, 19);
  assert.equal(result.batches, 2);
  assert.deepEqual(
    calls.map(({ functionName }) => functionName),
    [
      "seed:resetPrototypeBatch",
      "seed:resetPrototypeBatch",
      "seed:prototype",
    ],
  );
  assert.deepEqual(calls[0]?.args, {
    confirmation: "RESET_LOCAL_PROTOTYPE",
  });
  assert.ok(calls.every(({ agentMode }) => agentMode === "anonymous"));
});

test("refuses to reset any non-local Convex target", () => {
  assert.throws(
    () =>
      resetLocalFixtures({
        env: {
          NEXT_PUBLIC_CONVEX_URL:
            "https://warmhearted-raccoon-48.convex.cloud",
        },
        invoke() {
          assert.fail("the Convex CLI must not run");
        },
      }),
    /Refusing to use the production Convex deployment/u,
  );
});

test("stops when the reset result is malformed", () => {
  assert.throws(
    () =>
      resetLocalFixtures({
        env: localEnv,
        invoke() {
          return { status: "unexpected" };
        },
      }),
    /unexpected result/u,
  );
});
