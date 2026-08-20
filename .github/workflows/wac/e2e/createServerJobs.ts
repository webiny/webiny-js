import type { NormalJob } from "github-actions-wac";
import { createCheckoutPrSteps, createSetupVerdaccioSteps } from "../steps/index.js";
import { ACTION } from "../utils/index.js";
import { createJob } from "../jobs/index.js";
import {
    DIR_SERVER_PROJECT,
    DIR_WEBINY_JS,
    SERVER_ADMIN_PORT,
    SERVER_ADMIN_URL,
    SERVER_API_PORT,
    SERVER_API_URL,
    SERVER_BUILD_DIR
} from "./constants.js";
import { installBuildSteps, runBuildCacheDownloadSteps, yarnCacheSteps } from "./sharedSteps.js";

// The storage backends the self-hosted ("server") hosting type supports. Mirrors `StorageOps` in
// create-webiny-project's server project setup.
export type ServerStorageOps = "sqlite" | "postgres";

const STORAGE_DISPLAY_NAME: Record<ServerStorageOps, string> = {
    sqlite: "SQLite",
    postgres: "Postgres"
};

// Matches the defaults in the server/postgres template's .env.example, so the scaffolded project
// connects to the service container without any extra configuration.
const PG = {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "webiny"
};

// Self-hosted ("server" hosting type) E2E.
//
// Structurally different from the AWS jobs in one way that matters: a self-hosted project is not
// deployed anywhere, it runs ON THE RUNNER. The API process and the Admin static server only exist
// for the lifetime of the job that starts them, so scaffold / build / start / test all have to live
// in a SINGLE job - there is no deployed URL to hand to a separate Cypress job.
//
// Consequences: no `awsAuth`, no Pulumi backend, no `environment: next` secrets, and it runs on a
// GitHub-hosted runner. That makes it far cheaper than the DDB / DDB+OS jobs.
export const createServerJobs = (storageOps: ServerStorageOps) => {
    const isPostgres = storageOps === "postgres";
    const displayName = STORAGE_DISPLAY_NAME[storageOps];

    // Postgres runs as a service container; SQLite needs nothing (the template writes a file).
    const services: NormalJob["services"] = isPostgres
        ? {
              postgres: {
                  image: "postgres:17",
                  env: {
                      POSTGRES_USER: PG.user,
                      POSTGRES_PASSWORD: PG.password,
                      POSTGRES_DB: PG.database
                  },
                  ports: [`${PG.port}:${PG.port}`],
                  // Without a health check the job can reach `webiny build` before Postgres accepts
                  // connections.
                  options:
                      "--health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5"
              }
          }
        : undefined;

    // Supplied to every step that builds or runs the project, so the API talks to the right database.
    const storageEnv: Record<string, string> = isPostgres
        ? {
              WEBINY_PG_HOST: PG.host,
              WEBINY_PG_PORT: `${PG.port}`,
              WEBINY_PG_USER: PG.user,
              WEBINY_PG_PASSWORD: PG.password,
              WEBINY_PG_DATABASE: PG.database
          }
        : {};

    return {
        [`e2e-server-${storageOps}`]: createJob({
            needs: ["baseBranch", "constants", "build", "checkComment"],
            name: `E2E (Server) - ${displayName}`,
            checkout: { path: DIR_WEBINY_JS },
            ...(services ? { services } : {}),
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
                ...installBuildSteps,
                ...createSetupVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
                {
                    name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                    "working-directory": DIR_WEBINY_JS,
                    run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
                },
                {
                    name: "Version and publish to Verdaccio",
                    "working-directory": DIR_WEBINY_JS,
                    run: "yarn release --type=verdaccio"
                },
                {
                    name: "Disable Webiny telemetry",
                    run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
                },
                {
                    name: "Create a new self-hosted Webiny project",
                    run: `npx create-webiny-project@local-npm ${DIR_SERVER_PROJECT} --tag local-npm --no-interactive --hosting-type server --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"storageOps":"${storageOps}"}'`
                },
                {
                    name: "Print CLI version",
                    "working-directory": DIR_SERVER_PROJECT,
                    run: "yarn webiny --version"
                },
                {
                    // The Admin bundle bakes its API origin at build time, so WEBINY_API_URL has to
                    // be set here and match where the API is actually started below.
                    name: "Build API and Admin",
                    "working-directory": DIR_SERVER_PROJECT,
                    env: {
                        WEBINY_HOSTING_TYPE: "server",
                        WEBINY_API_URL: SERVER_API_URL,
                        ...storageEnv
                    },
                    run: "yarn webiny build api && yarn webiny build admin"
                },
                {
                    // Backgrounded so the job can continue; the process lives for the rest of the
                    // job. Logs go to a file so the failure handler below can surface them.
                    name: "Start API",
                    env: { PORT: `${SERVER_API_PORT}`, ...storageEnv },
                    run: [
                        `cd ${SERVER_BUILD_DIR}/api/graphql/build`,
                        "nohup node start.mjs > /tmp/webiny-api.log 2>&1 &",
                        `echo "API starting on port ${SERVER_API_PORT}"`
                    ].join("\n")
                },
                {
                    // `serve -s` gives the SPA fallback the Admin app needs (a hard refresh on a
                    // client-side route must not 404) - the same thing nginx-spa.conf does for the
                    // documented Docker setup. `serve` itself is not published to Verdaccio, but
                    // .verdaccio.yaml proxies `**` to the npmjs uplink, so npx resolves it even
                    // though the registry is pointed at localhost:4873 at this point.
                    name: "Serve Admin",
                    run: [
                        `nohup npx --yes serve -s ${SERVER_BUILD_DIR}/admin/build -l ${SERVER_ADMIN_PORT} > /tmp/webiny-admin.log 2>&1 &`,
                        `echo "Admin starting on port ${SERVER_ADMIN_PORT}"`
                    ].join("\n")
                },
                {
                    name: "Wait for API and Admin",
                    run: [
                        "set -euo pipefail",
                        "",
                        "wait_for_port() {",
                        "  for _ in $(seq 1 90); do",
                        '    if (echo > /dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1; then',
                        '      echo "port $1 is accepting connections"',
                        "      return 0",
                        "    fi",
                        "    sleep 2",
                        "  done",
                        '  echo "::error::Timed out waiting for port $1."',
                        "  return 1",
                        "}",
                        "",
                        `wait_for_port ${SERVER_API_PORT}`,
                        `wait_for_port ${SERVER_ADMIN_PORT}`,
                        "",
                        "# A listening socket is not the same as a working GraphQL endpoint.",
                        `curl -fsS -X POST ${SERVER_API_URL}/graphql -H 'content-type: application/json' \\`,
                        `  -d '{"query":"{__typename}"}' > /dev/null`,
                        'echo "GraphQL API responded."'
                    ].join("\n")
                },
                {
                    name: "Create Cypress config",
                    "working-directory": DIR_WEBINY_JS,
                    run: `yarn setup-cypress:server --apiUrl ${SERVER_API_URL} --adminUrl ${SERVER_ADMIN_URL}`
                },
                {
                    name: "Install Cypress binary",
                    "working-directory": DIR_WEBINY_JS,
                    run: "cd cypress-tests && yarn cypress install"
                },
                {
                    // Only the installation wizard for now. It is pure UI (no cy.login), so it does
                    // not need the Cognito-based auth helper that the other specs use - porting that
                    // to the self-hosted identity provider comes next.
                    name: "Cypress - run installation wizard test",
                    "working-directory": DIR_WEBINY_JS,
                    run: 'yarn cy:run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"'
                },
                {
                    name: "Print server logs",
                    if: "failure()",
                    run: [
                        'echo "::group::API log"; cat /tmp/webiny-api.log || true; echo "::endgroup::"',
                        'echo "::group::Admin log"; cat /tmp/webiny-admin.log || true; echo "::endgroup::"'
                    ].join("\n")
                },
                {
                    name: "Upload Cypress screenshots",
                    if: "failure()",
                    uses: ACTION.uploadArtifactV6,
                    with: {
                        name: `cypress-screenshots-server-${storageOps}`,
                        "retention-days": 1,
                        "if-no-files-found": "ignore",
                        path: `${DIR_WEBINY_JS}/cypress-tests/cypress/screenshots`
                    }
                }
            ]
        })
    };
};
