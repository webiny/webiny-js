import type { NormalJob } from "github-actions-wac";
import { createCheckoutPrSteps } from "../steps/index.js";
import { createConfigureBugReporterSteps } from "../steps/index.js";
import { BUG_REPORTER_ENV } from "../steps/index.js";
import { createJob } from "../jobs/index.js";
import { ACTION } from "../utils/index.js";
import { VALKEY_SERVICE } from "../utils/index.js";
import { VALKEY_TEST_URL } from "../utils/index.js";
import {
    DIR_STANDALONE_PROJECT,
    DIR_WEBINY_JS,
    PATH_STANDALONE_PROJECT,
    STANDALONE_ADMIN_PORT,
    STANDALONE_ADMIN_URL,
    STANDALONE_API_PORT,
    STANDALONE_API_URL,
    STANDALONE_BUILD_DIR
} from "./constants.js";
import { installSteps, yarnCacheSteps } from "./sharedSteps.js";
import { createStatusRowUpdateSteps } from "./statusComment.js";
import { createReportStatusJob } from "./reportStatus.js";
import {
    AI_E2E_JOB_IF,
    AI_E2E_LICENSE_ENV,
    IS_AI_E2E_RUN,
    aiE2eCommentRow,
    createAiE2eSteps
} from "./aiE2e.js";
import { createInstallationTestSteps } from "./installationTest.js";
import { createUnlicensedE2eSteps } from "./unlicensedE2e.js";
import { createPublishToVerdaccioSteps, createRestoreVerdaccioSteps } from "./verdaccio.js";

// The storage backends the standalone hosting type supports. Mirrors `StorageOps` in
// create-webiny-project's standalone project setup.
export type StandaloneStorageOps = "sqlite" | "postgres";

const STORAGE_DISPLAY_NAME: Record<StandaloneStorageOps, string> = {
    sqlite: "SQLite",
    postgres: "Postgres"
};

// The label used both for the job name and for this variant's row in the PR status comment. The
// job seds on exactly this string, so deriving both from one place keeps them from drifting.
export const standaloneVariantLabel = (storageOps: StandaloneStorageOps, apiProcesses = 1) => {
    const storage = STORAGE_DISPLAY_NAME[storageOps];
    if (apiProcesses > 1) {
        return `Standalone (${storage}, ${apiProcesses} API processes)`;
    }
    return `Standalone (${storage})`;
};

// The same for a WCP variant: a project connected to WCP, which these jobs always are, with the
// full license.
export const wcpVariantLabel = (storageOps: StandaloneStorageOps) =>
    `Standalone (${STORAGE_DISPLAY_NAME[storageOps]}, WCP)`;

export const wcpVariantCommentRow = (storageOps: StandaloneStorageOps) =>
    aiE2eCommentRow(wcpVariantLabel(storageOps));

// A standalone project runs on the runner, so there is no Admin URL anyone outside the job could
// open - hence "-" in that column, unlike the AWS rows.
export const standaloneVariantCommentRow = (storageOps: StandaloneStorageOps, apiProcesses = 1) =>
    `| ${standaloneVariantLabel(storageOps, apiProcesses)} | 🔄 Running... | - |`;

// Matches the defaults in the standalone/postgres template's .env.example, so the scaffolded project
// connects to the service container without any extra configuration.
const PG = {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "webiny"
};

// The two folders a standalone build produces that the running project needs. Both run on their
// own: the documented Docker setup copies exactly these out of the project and nothing else.
const API_BUILD_DIR = `${STANDALONE_BUILD_DIR}/api/graphql/build`;
const ADMIN_BUILD_DIR = `${STANDALONE_BUILD_DIR}/admin/build`;

// Standalone hosting-type E2E.
//
// Structurally different from the AWS jobs in one way that matters: a standalone project is not
// deployed anywhere, it runs ON THE RUNNER. The API process and the Admin static server only exist
// for the lifetime of the job that starts them, so start / test have to live in the same job -
// there is no deployed URL to hand to a separate test job. The BUILD can move: the WCP variants
// build once and hand the build folders to several test jobs (see createWcpStandaloneJobs).
//
// Consequences: no `awsAuth`, no Pulumi backend, no `environment: next` secrets, and it runs on a
// GitHub-hosted runner. That makes it far cheaper than the DDB / DDB+OS jobs.
interface StandaloneProjectParams {
    // Where the webiny-js checkout lives: the PR's base branch expression for `/e2e`, a literal
    // directory for `push`.
    workingDirectory: string;
    // Build with a WCP license and run with it. The regular variants stay unlicensed.
    wcp?: boolean;
}

/*
 * Postgres runs as a service container; SQLite needs nothing (the template writes a file). Several
 * API processes also need Valkey, which carries websocket messages between them.
 */
const createServices = (
    storageOps: StandaloneStorageOps,
    apiProcesses = 1
): NormalJob["services"] => {
    const services: NonNullable<NormalJob["services"]> = {};
    if (storageOps === "postgres") {
        services.postgres = {
            image: "postgres:17",
            env: {
                POSTGRES_USER: PG.user,
                POSTGRES_PASSWORD: PG.password,
                POSTGRES_DB: PG.database
            },
            ports: [`${PG.port}:${PG.port}`],
            /*
             * Without a health check the job can reach `webiny build` before Postgres accepts
             * connections.
             */
            options:
                "--health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5"
        };
    }
    if (apiProcesses > 1) {
        Object.assign(services, VALKEY_SERVICE);
    }
    if (Object.keys(services).length === 0) {
        return undefined;
    }
    return services;
};

/*
 * With several API processes, each listens on a port of its own and nginx listens on
 * STANDALONE_API_PORT in front of them, so the Admin's baked API URL and every test stay as they are.
 */
const apiProcessPort = (index: number) => STANDALONE_API_PORT + 10 + index;

/*
 * nginx in front of the API processes. Round robin, so consecutive requests and websocket connections
 * land on different processes. The upgrade headers let websockets through, and `$http_host` passes the
 * Host header on exactly as the browser sent it, port included. `client_max_body_size 0`
 * lifts nginx's 1 MB default, which uploads would hit. The 60-second `proxy_read_timeout` default is
 * left as it is on purpose: it is what real deployments run with, and the API's 30-second websocket
 * ping has to keep idle sockets under it.
 */
const createNginxConfig = (apiProcesses: number) => {
    const upstreams = Array.from({ length: apiProcesses }, (_, index) => {
        const port = apiProcessPort(index);
        return `        server 127.0.0.1:${port};`;
    });
    return [
        "worker_processes 1;",
        "pid /tmp/webiny-nginx.pid;",
        "error_log /tmp/webiny-nginx-error.log;",
        "events {}",
        "http {",
        "    access_log /tmp/webiny-nginx-access.log;",
        "    client_max_body_size 0;",
        "    map $http_upgrade $connection_upgrade {",
        "        default upgrade;",
        "        '' close;",
        "    }",
        "    upstream webiny_api {",
        ...upstreams,
        "    }",
        "    server {",
        `        listen ${STANDALONE_API_PORT};`,
        "        location / {",
        "            proxy_pass http://webiny_api;",
        "            proxy_http_version 1.1;",
        "            proxy_set_header Upgrade $http_upgrade;",
        "            proxy_set_header Connection $connection_upgrade;",
        "            proxy_set_header Host $http_host;",
        "            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
        "            proxy_request_buffering off;",
        "            proxy_buffering off;",
        "        }",
        "    }",
        "}"
    ].join("\n");
};

/**
 * Scaffolds a standalone project from the packages in Verdaccio and builds its API and Admin.
 * Verdaccio has to be running with the packages already published.
 */
const createBuildStandaloneProjectSteps = (
    storageOps: StandaloneStorageOps,
    { workingDirectory, wcp }: StandaloneProjectParams
): NonNullable<NormalJob["steps"]> => [
    {
        name: "Disable Webiny telemetry",
        run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
    },
    {
        name: "Create a new standalone Webiny project",
        run: `npx create-webiny-project@local-npm ${DIR_STANDALONE_PROJECT} --tag local-npm --no-interactive --hosting-type standalone --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"storageOps":"${storageOps}"}'`
    },
    ...createConfigureBugReporterSteps({
        workingDirectory,
        projectPath: PATH_STANDALONE_PROJECT
    }),
    {
        name: "Print CLI version",
        "working-directory": DIR_STANDALONE_PROJECT,
        run: "yarn webiny --version"
    },
    {
        // The Admin bundle bakes its API origin at build time, so WEBINY_API_URL has to
        // be set here and match where the API is actually started below.
        name: "Build API and Admin",
        "working-directory": DIR_STANDALONE_PROJECT,
        // Only what the build actually bakes in: the hosting type, and the API origin,
        // which the Admin bundle embeds. Database configuration is NOT needed here -
        // `<Infra.Sqlite>` / `<Infra.Postgres>` in webiny.config.tsx already bake their
        // own values, and the standalone handler we run below ignores those anyway (see
        // the runtime env on "Start API").
        env: {
            WEBINY_HOSTING_TYPE: "standalone",
            WEBINY_API_URL: STANDALONE_API_URL,
            /*
             * `<Project.BugReporter>` reads these while the API bundle is built, so they
             * belong on this step rather than at runtime on "Start API".
             */
            ...BUG_REPORTER_ENV,
            ...(wcp ? AI_E2E_LICENSE_ENV : {})
        },
        run: "yarn webiny build api && yarn webiny build admin"
    }
];

/*
 * Starts several API processes at once, as a deployment starts its replicas, each on its own port
 * with the same env, then nginx in front of them on STANDALONE_API_PORT. nginx comes with GitHub's
 * Ubuntu runners; it is installed when it is missing.
 */
const createStartApiProcessesSteps = (
    apiProcesses: number,
    apiEnv: Record<string, string>,
    prepareFolders: string[]
): NonNullable<NormalJob["steps"]> => {
    const startEach = Array.from({ length: apiProcesses }, (_, index) => {
        const port = apiProcessPort(index);
        const log = `/tmp/webiny-api-${index + 1}.log`;
        return `PORT=${port} nohup node start.mjs > ${log} 2>&1 &`;
    });
    return [
        {
            name: `Start ${apiProcesses} API processes`,
            env: apiEnv,
            run: [
                ...prepareFolders,
                ...startEach,
                `echo "${apiProcesses} API processes starting"`
            ].join("\n")
        },
        {
            name: "Start nginx in front of the API processes",
            run: [
                "set -euo pipefail",
                "command -v nginx > /dev/null || (sudo apt-get update && sudo apt-get install -y nginx)",
                "cat > /tmp/webiny-nginx.conf <<'NGINX'",
                createNginxConfig(apiProcesses),
                "NGINX",
                "sudo nginx -t -c /tmp/webiny-nginx.conf",
                "sudo nginx -c /tmp/webiny-nginx.conf",
                `echo "nginx listening on port ${STANDALONE_API_PORT}"`
            ].join("\n")
        }
    ];
};

/**
 * Starts the built API and Admin in the background and waits until both answer. They live for the
 * rest of the job.
 */
const createStartStandaloneProjectSteps = (
    storageOps: StandaloneStorageOps,
    { wcp, apiProcesses = 1 }: Pick<StandaloneProjectParams, "wcp"> & { apiProcesses?: number }
): NonNullable<NormalJob["steps"]> => {
    // Supplied to the API process, so it talks to the right database.
    //
    // Why this is needed even though webiny.config.tsx already configures the database:
    // `<Infra.Sqlite>` renders an `EnvVar` that is BAKED for the api runtime, and `runApiServer`
    // (what `yarn webiny watch` uses) hands that baked env to the API process. Running the
    // standalone handler directly - `node start.mjs`, which is what the documented Docker setup
    // does too - bypasses that entirely, so the process sees none of it and exits immediately:
    //
    //   Error: WEBINY_SQL_FILENAME is not set. Configure the database via
    //   <Infra.Sqlite filename="..." /> in webiny.config.
    //
    // Absolute paths, because the API is started from inside its build folder rather than from the
    // project root.
    const storageEnv: Record<string, string> =
        storageOps === "postgres"
            ? {
                  WEBINY_PG_HOST: PG.host,
                  WEBINY_PG_PORT: `${PG.port}`,
                  WEBINY_PG_USER: PG.user,
                  WEBINY_PG_PASSWORD: PG.password,
                  WEBINY_PG_DATABASE: PG.database
              }
            : {
                  WEBINY_SQL_FILENAME: `\${{ github.workspace }}/${DIR_STANDALONE_PROJECT}/.webiny/server.sqlite`
              };

    const apiEnv: Record<string, string> = {
        ...storageEnv,
        // The API reads these when it starts and refuses to boot without the required ones.
        WEBINY_API_URL: STANDALONE_API_URL,
        WEBINY_ADMIN_URL: STANDALONE_ADMIN_URL,
        /*
         * Uploaded files land on disk rather than in a bucket. Also absolute. Several API
         * processes share this one folder, as they would share a volume.
         */
        WEBINY_LOCAL_STORAGE_PATH: `\${{ github.workspace }}/${DIR_STANDALONE_PROJECT}/.webiny/storage`,
        WEBINY_UPLOAD_SECRET: "e2e-upload-secret",
        WEBINY_SELF_HOSTED_AUTH_SECRET: "e2e-signing-secret",
        WEBINY_ENCRYPTION_PASSPHRASE: "e2e-encryption-passphrase",
        WEBINY_HASHING_PEPPER: "e2e-hashing-pepper"
    };
    if (wcp) {
        Object.assign(apiEnv, AI_E2E_LICENSE_ENV);
    }
    if (apiProcesses > 1) {
        // Carries websocket messages between the processes.
        apiEnv["WEBINY_REDIS_URL"] = VALKEY_TEST_URL;
    }

    const prepareFolders = [
        /*
         * SQLite will not create missing parent directories for its file, and the
         * local file storage folder does not exist until something writes to it.
         */
        'mkdir -p "$(dirname "${WEBINY_SQL_FILENAME:-/tmp/unused}")"',
        'mkdir -p "${WEBINY_LOCAL_STORAGE_PATH:-/tmp/unused}"',
        `cd ${API_BUILD_DIR}`
    ];

    /*
     * Backgrounded so the job can continue. Logs go to a file so the failure handler
     * (printServerLogsStep) can surface them.
     */
    let startApi: NonNullable<NormalJob["steps"]> = [
        {
            name: "Start API",
            env: { PORT: `${STANDALONE_API_PORT}`, ...apiEnv },
            run: [
                ...prepareFolders,
                "nohup node start.mjs > /tmp/webiny-api.log 2>&1 &",
                `echo "API starting on port ${STANDALONE_API_PORT}"`
            ].join("\n")
        }
    ];
    let processPorts: number[] = [];
    if (apiProcesses > 1) {
        startApi = createStartApiProcessesSteps(apiProcesses, apiEnv, prepareFolders);
        processPorts = Array.from({ length: apiProcesses }, (_, index) => apiProcessPort(index));
    }

    return [
        ...startApi,
        {
            // `serve -s` gives the SPA fallback the Admin app needs (a hard refresh on a
            // client-side route must not 404) - the same thing nginx-spa.conf does for the
            // documented Docker setup. `serve` is not published to Verdaccio; where Verdaccio
            // is the registry, .verdaccio.yaml proxies `**` to the npmjs uplink.
            name: "Serve Admin",
            run: [
                `nohup npx --yes serve -s ${ADMIN_BUILD_DIR} -l ${STANDALONE_ADMIN_PORT} > /tmp/webiny-admin.log 2>&1 &`,
                `echo "Admin starting on port ${STANDALONE_ADMIN_PORT}"`
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
                ...processPorts.map(port => `wait_for_port ${port}`),
                `wait_for_port ${STANDALONE_API_PORT}`,
                `wait_for_port ${STANDALONE_ADMIN_PORT}`,
                "",
                "# A listening socket is not the same as a working GraphQL endpoint.",
                `curl -fsS -X POST ${STANDALONE_API_URL}/graphql -H 'content-type: application/json' \\`,
                `  -d '{"query":"{__typename}"}' > /dev/null`,
                'echo "GraphQL API responded."'
            ].join("\n")
        }
    ];
};

// One API log, or one per API process plus nginx's error log when there are several.
const printServerLogsStep = {
    name: "Print server logs",
    if: "failure()",
    run: [
        "for log in /tmp/webiny-api*.log /tmp/webiny-nginx-error.log; do",
        '  [ -f "$log" ] || continue',
        '  echo "::group::$log"; cat "$log"; echo "::endgroup::"',
        "done",
        'echo "::group::Admin log"; cat /tmp/webiny-admin.log || true; echo "::endgroup::"'
    ].join("\n")
};

interface StandaloneProjectPartsParams {
    workingDirectory: string;
    // When set, the variant reports its result into the PR status comment under this label. `push`
    // has no PR to report into, so it omits this.
    statusLabel?: string;
    // `publish`: the job has built packages and publishes them to Verdaccio itself (`push`).
    // `restore`: the `publish` job already did, and this job starts Verdaccio on its storage (`/e2e`).
    verdaccio: "publish" | "restore";
    // See createInstallationTestSteps.
    savePlaywrightCache?: boolean;
    /*
     * Build and run with a WCP license, and run the whole `e2e/` suite instead of the unlicensed
     * tests.
     */
    wcp?: boolean;
    /*
     * With `wcp`: record replay steps and upload them under this artifact name (see
     * createAiE2eSteps).
     */
    recordCacheArtifactName?: string;
}

// Runs after the installation test: the whole suite when licensed, else the unlicensed tests.
const createProjectTestSteps = (
    storageOps: StandaloneStorageOps,
    {
        workingDirectory,
        wcp,
        recordCacheArtifactName
    }: Pick<StandaloneProjectPartsParams, "workingDirectory" | "wcp" | "recordCacheArtifactName">
) => {
    if (wcp) {
        return createAiE2eSteps({
            workingDirectory,
            artifactName: `ai-e2e-results-standalone-${storageOps}-wcp`,
            shard: "1/1",
            recordCacheArtifactName
        });
    }

    return createUnlicensedE2eSteps({
        workingDirectory,
        adminUrl: STANDALONE_ADMIN_URL,
        artifactName: `e2e-test-results-standalone-${storageOps}`
    });
};

/**
 * The standalone project lifecycle in one job, shared by the `push` and the scheduled replay
 * recording workflows: Verdaccio, scaffold, build, start, wait for readiness, run the tests, dump
 * logs on failure.
 *
 * The wrapping job supplies what differs between the two - how the repository is checked out, and
 * whether it builds the packages.
 */
export const createStandaloneProjectParts = (
    storageOps: StandaloneStorageOps,
    {
        workingDirectory,
        statusLabel,
        verdaccio,
        savePlaywrightCache,
        wcp,
        recordCacheArtifactName
    }: StandaloneProjectPartsParams
) => ({
    services: createServices(storageOps),
    steps: [
        ...(verdaccio === "publish"
            ? createPublishToVerdaccioSteps({ workingDirectory })
            : createRestoreVerdaccioSteps({ workingDirectory })),
        ...createBuildStandaloneProjectSteps(storageOps, { workingDirectory, wcp }),
        ...createStartStandaloneProjectSteps(storageOps, { wcp }),
        ...createInstallationTestSteps({
            workingDirectory,
            adminUrl: STANDALONE_ADMIN_URL,
            artifactName: `e2e-results-standalone-${storageOps}${wcp ? "-wcp" : ""}`,
            savePlaywrightCache
        }),
        ...createProjectTestSteps(storageOps, { workingDirectory, wcp, recordCacheArtifactName }),
        ...(statusLabel ? createStatusRowUpdateSteps({ label: statusLabel }) : []),
        printServerLogsStep
    ]
});

export interface StandaloneVariant {
    storageOps: StandaloneStorageOps;
    // Build with a WCP license and run the whole `e2e/` suite. Only for the people in
    // AI_E2E_USERS. Without it the project is unlicensed and runs the tests that need neither a
    // license nor a model.
    wcp: boolean;
    // How many test jobs split the variant's tests between them (`e2e run --shard i/N`).
    shards: number;
    /*
     * How many API processes run behind nginx. 1 when omitted. More than one checks that the API
     * works when requests, uploads and websockets land on different processes.
     */
    apiProcesses?: number;
}

/**
 * The `/e2e` command's jobs for one standalone variant:
 * - build: scaffolds and builds the project once from the packages in Verdaccio, and uploads the
 *   API and Admin build folders.
 * - tests: one job per shard. Each starts its own API and Admin from those folders, on its own empty
 *   database, runs the installation test to create the admin user, then its slice of the suite.
 * - report status: writes the shards' combined result into the status comment (createReportStatusJob).
 *
 * A WCP variant is a set of jobs of its own rather than a license on the regular ones, so `/e2e`
 * still covers an unlicensed project for everyone, the AI users included. Its status comment row
 * (wcpVariantCommentRow) only appears on the runs it takes part in.
 */
export const createStandaloneVariantJobs = ({
    storageOps,
    wcp,
    shards,
    apiProcesses = 1
}: StandaloneVariant) => {
    let label = standaloneVariantLabel(storageOps, apiProcesses);
    let id: string = storageOps;
    if (wcp) {
        label = wcpVariantLabel(storageOps);
        id = `${storageOps}-wcp`;
    }
    if (apiProcesses > 1) {
        id = `${id}-${apiProcesses}-processes`;
    }
    // The build needs only the database; Valkey is for the running processes.
    const buildServices = createServices(storageOps);
    const services = createServices(storageOps, apiProcesses);
    const jobKeys = {
        build: `e2e-standalone-${id}-build`,
        tests: `e2e-standalone-${id}`,
        report: `e2e-standalone-${id}-report`
    };
    const buildArchive = `standalone-build-${id}.tzst`;
    const buildArtifactName = `standalone-build-${id}`;
    const shard = `\${{ matrix.shard }}/${shards}`;

    const buildJob = createJob({
        needs: ["baseBranch", "publish", "checkComment"],
        name: `E2E - ${label} - Build`,
        ...(wcp ? { if: AI_E2E_JOB_IF } : {}),
        checkout: { path: DIR_WEBINY_JS },
        services: buildServices,
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...yarnCacheSteps,
            ...installSteps,
            ...createRestoreVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...createBuildStandaloneProjectSteps(storageOps, {
                workingDirectory: DIR_WEBINY_JS,
                wcp
            }),
            {
                name: "Compress API and Admin builds",
                run: `tar -cf ${buildArchive} --use-compress-program=zstdmt ${API_BUILD_DIR} ${ADMIN_BUILD_DIR}`
            },
            {
                name: "Upload API and Admin builds",
                uses: ACTION.uploadArtifact,
                with: {
                    name: buildArtifactName,
                    path: buildArchive,
                    "retention-days": 1,
                    "compression-level": 0,
                    "if-no-files-found": "error",
                    overwrite: true
                }
            }
        ]
    });

    const testsJob = createJob({
        needs: ["baseBranch", jobKeys.build],
        name: `E2E - ${label} / shard \${{ matrix.shard }}`,
        strategy: {
            // Every shard reports, so one failure doesn't hide the others.
            "fail-fast": false,
            matrix: { shard: Array.from({ length: shards }, (_, i) => i + 1) }
        },
        checkout: { path: DIR_WEBINY_JS },
        ...(services ? { services } : {}),
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...yarnCacheSteps,
            ...installSteps,
            {
                name: "Download API and Admin builds",
                uses: ACTION.downloadArtifact,
                with: { name: buildArtifactName }
            },
            {
                name: "Extract API and Admin builds",
                run: `tar -xf ${buildArchive} --use-compress-program=zstdmt`
            },
            ...createStartStandaloneProjectSteps(storageOps, { wcp, apiProcesses }),
            ...createInstallationTestSteps({
                workingDirectory: DIR_WEBINY_JS,
                adminUrl: STANDALONE_ADMIN_URL,
                artifactName: `e2e-results-standalone-${id}-shard-\${{ matrix.shard }}`
            }),
            ...(wcp
                ? createAiE2eSteps({
                      workingDirectory: DIR_WEBINY_JS,
                      artifactName: `ai-e2e-results-standalone-${id}-shard-\${{ matrix.shard }}`,
                      shard
                  })
                : createUnlicensedE2eSteps({
                      workingDirectory: DIR_WEBINY_JS,
                      adminUrl: STANDALONE_ADMIN_URL,
                      artifactName: `e2e-test-results-standalone-${id}-shard-\${{ matrix.shard }}`,
                      shard
                  })),
            printServerLogsStep
        ]
    });

    const reportJob = createReportStatusJob({
        label,
        buildJobKey: jobKeys.build,
        testsJobKey: jobKeys.tests,
        // Not for people outside AI_E2E_USERS: the WCP rows don't exist in their comment.
        ...(wcp ? { if: IS_AI_E2E_RUN } : {})
    });

    return {
        [jobKeys.build]: buildJob,
        [jobKeys.tests]: testsJob,
        [jobKeys.report]: reportJob
    };
};
