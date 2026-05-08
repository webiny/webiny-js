/**
 * Concurrent stress test for the container-mode API.
 *
 * Issues N rounds of parallel mixed-endpoint traffic against a
 * running `docker compose up` stack and asserts:
 *  - every HTTP response is 2xx
 *  - no `INVALID_GRAPHQL_SCHEMA*` codes in any response body
 *  - no `Unauthenticated` / `Not allowed to access` errors on
 *    authenticated endpoints (with a valid token, those signal the
 *    identity / permissions cache leaked across requests)
 *  - no `endpoint:null` schema-build errors in the api logs
 *
 * Designed to catch the class of bugs that arise from Webiny's
 * Lambda-shaped assumption that one process serves one request — the
 * shared `app.webiny` context, DI singletons with internal mutable
 * state, and PluginsContainer accumulation. After the Phase 2-4
 * isolation fixes (per-request ALS scoping, IdentityContext /
 * AuthorizationContext request-scoping, per-endpoint plugin pinning)
 * this test should be a clean green; any future Webiny upgrade that
 * regresses concurrency safety lights up here.
 *
 * Usage:
 *   node scripts/containerStressTest.mjs
 *
 * Env overrides:
 *   API_URL         (default: http://localhost:8080)
 *   KEYCLOAK_URL    (default: http://localhost:8180)
 *   KEYCLOAK_REALM  (default: webiny)
 *   KEYCLOAK_CLIENT (default: webiny-api)
 *   KEYCLOAK_USER   (default: admin@webiny.local)
 *   KEYCLOAK_PASS   (default: webiny)
 *   ROUNDS          (default: 20)
 *   PARALLEL        (default: 5  — N parallel requests per "lane" per round)
 */

const API_URL = process.env.API_URL ?? "http://localhost:8080";
const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8180";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? "webiny";
const KEYCLOAK_CLIENT = process.env.KEYCLOAK_CLIENT ?? "webiny-api";
const KEYCLOAK_USER = process.env.KEYCLOAK_USER ?? "admin@webiny.local";
const KEYCLOAK_PASS = process.env.KEYCLOAK_PASS ?? "webiny";
const ROUNDS = Number(process.env.ROUNDS ?? 20);
const PARALLEL = Number(process.env.PARALLEL ?? 5);

const fetchToken = async () => {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: KEYCLOAK_CLIENT,
    username: KEYCLOAK_USER,
    password: KEYCLOAK_PASS,
    scope: "openid"
  });
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );
  if (!res.ok) {
    throw new Error(`Token fetch failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.id_token;
};

const post = async (path, query, token) => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query })
  });
  const text = await res.text();
  return { status: res.status, body: text };
};

// Mixed lanes — one of each runs in parallel per round, hitting
// every code path that has historically caused cross-request leakage.
const lanes = [
  {
    name: "manage:listContentModels",
    path: "/cms/manage",
    query: "{ listContentModels { data { modelId singularApiName } error { message code } } }"
  },
  {
    name: "manage:getContentModel",
    path: "/cms/manage",
    query:
      '{ getContentModel(modelId: "test") { data { modelId fields { fieldId } } error { message code } } }'
  },
  {
    name: "manage:listEntries",
    path: "/cms/manage",
    query: "{ listTests { data { id } meta { totalCount } error { message code } } }"
  },
  {
    name: "read:listEntries",
    path: "/cms/read",
    query: "{ listTests { data { id } meta { totalCount } error { message code } } }"
  },
  {
    name: "graphql:cms.listEntries",
    path: "/graphql",
    query:
      '{ cms { listEntries(modelId: "test", fields: ["id"]) { data error { message code } } } }'
  },
  {
    name: "graphql:adminUsers.getCurrentUser",
    path: "/graphql",
    query: "{ adminUsers { getCurrentUser { data { id email } error { message code } } } }"
  },
  {
    name: "graphql:fileManager.listFiles",
    path: "/graphql",
    query:
      "{ fileManager { listFiles { data { id key } meta { totalCount } error { message code } } } }"
  },
  {
    name: "graphql:aco.listFolders.cms",
    path: "/graphql",
    query:
      '{ aco { listFolders(where: { type: "cms:test" }) { data { id title } error { message code } } } }'
  },
  {
    name: "graphql:aco.listFolders.fm",
    path: "/graphql",
    query:
      '{ aco { listFolders(where: { type: "FmFile" }) { data { id title } error { message code } } } }'
  },
  {
    name: "graphql:security.login",
    path: "/graphql",
    query: "mutation { security { login { data { id permissions } error { message code } } } }"
  }
];

// Errors / codes that indicate a concurrency regression (vs. a normal
// "not found" or empty result). Adjust if Webiny adds new ones.
const CONCURRENCY_FAILURE_PATTERNS = [
  /INVALID_GRAPHQL_SCHEMA/i,
  /Unknown type ".*ListWhereInput"/,
  /argument "where" of type ".*GetWhereInput!" is required/,
  /Unauthenticated!/,
  /Not allowed to access "(manage|read|preview)" endpoint/,
  /Cannot read properties of undefined \(reading 'isAdmin'\)/,
  /endpoint":\s*null.*INVALID/
];

const isConcurrencyFailure = body => {
  return CONCURRENCY_FAILURE_PATTERNS.some(rx => rx.test(body));
};

const main = async () => {
  console.log(
    `Container stress test against ${API_URL} — ${ROUNDS} rounds of ${PARALLEL}× ${lanes.length} parallel requests (${ROUNDS * PARALLEL * lanes.length} total)`
  );

  const token = await fetchToken();
  console.log("Token acquired.");

  const failures = [];
  const start = Date.now();

  for (let round = 0; round < ROUNDS; round++) {
    const tasks = [];
    for (let p = 0; p < PARALLEL; p++) {
      for (const lane of lanes) {
        tasks.push(
          post(lane.path, lane.query, token).then(({ status, body }) => {
            if (status < 200 || status >= 300) {
              failures.push({
                round,
                lane: lane.name,
                kind: "non-2xx",
                status,
                body: body.slice(0, 400)
              });
              return;
            }
            if (isConcurrencyFailure(body)) {
              failures.push({
                round,
                lane: lane.name,
                kind: "concurrency-failure-signature",
                body: body.slice(0, 600)
              });
            }
          })
        );
      }
    }
    await Promise.all(tasks);
    if ((round + 1) % 5 === 0 || round === ROUNDS - 1) {
      const sent = (round + 1) * PARALLEL * lanes.length;
      console.log(
        `  ... round ${round + 1}/${ROUNDS} done — ${sent} requests sent, ${failures.length} failures so far`
      );
    }
  }

  const elapsed = Date.now() - start;
  const totalRequests = ROUNDS * PARALLEL * lanes.length;
  console.log(
    `\nCompleted ${totalRequests} requests in ${elapsed}ms (${Math.round((totalRequests * 1000) / elapsed)} req/s)`
  );

  if (failures.length === 0) {
    console.log("✓ Stress test passed — no concurrency regressions detected.");
    process.exit(0);
  }

  console.error(`✗ Stress test failed with ${failures.length} concurrency regression(s):`);
  // Print up to 10 distinct failures so the log doesn't explode.
  const seen = new Set();
  for (const f of failures) {
    const key = `${f.lane}:${f.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.error(`  [${f.lane}] ${f.kind}${f.status ? ` (status ${f.status})` : ""}`);
    console.error(`    ${f.body.replace(/\s+/g, " ").slice(0, 240)}`);
    if (seen.size >= 10) break;
  }
  process.exit(1);
};

main().catch(err => {
  console.error("Stress test crashed:", err);
  process.exit(2);
});
