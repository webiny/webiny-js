import type { NormalJob } from "github-actions-wac";
import { createCheckoutPrSteps } from "../steps/index.js";
import { createConfigureBugReporterSteps } from "../steps/index.js";
import { BUG_REPORTER_ENV } from "../steps/index.js";
import { createJob } from "../jobs/index.js";
import { ACTION } from "../utils/index.js";
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
export const standaloneVariantLabel = (storageOps: StandaloneStorageOps) =>
    `Standalone (${STORAGE_DISPLAY_NAME[storageOps]})`;

// The same for a WCP variant: a project connected to WCP, which these jobs always are, with the
// full license.
export const wcpVariantLabel = (storageOps: StandaloneStorageOps) =>
    `Standalone (${STORAGE_DISPLAY_NAME[storageOps]}, WCP)`;

export const wcpVariantCommentRow = (storageOps: StandaloneStorageOps) =>
    aiE2eCommentRow(wcpVariantLabel(storageOps));

// A standalone project runs on the runner, so there is no Admin URL anyone outside the job could
// open - hence "-" in that column, unlike the AWS rows.
export const standaloneVariantCommentRow = (storageOps: StandaloneStorageOps) =>
    `| ${standaloneVariantLabel(storageOps)} | 🔄 Running... | - |`;

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

// Postgres runs as a service container; SQLite needs nothing (the template writes a file).
const createServices = (storageOps: StandaloneStorageOps): NormalJob["services"] =>
    storageOps === "postgres"
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

/**
 * Starts the built API and Admin in the background and waits until both answer. They live for the
 * rest of the job.
 */
const createStartStandaloneProjectSteps = (
    storageOps: StandaloneStorageOps,
    { wcp }: Pick<StandaloneProjectParams, "wcp">
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

    return [
        {
            // Backgrounded so the job can continue. Logs go to a file so the failure handler
            // (printServerLogsStep) can surface them.
            name: "Start API",
            env: {
                PORT: `${STANDALONE_API_PORT}`,
                ...storageEnv,
                // Uploaded files land on disk rather than in a bucket. Also absolute.
                WEBINY_LOCAL_STORAGE_PATH: `\${{ github.workspace }}/${DIR_STANDALONE_PROJECT}/.webiny/storage`,
                ...(wcp ? AI_E2E_LICENSE_ENV : {})
            },
            run: [
                // SQLite will not create missing parent directories for its file, and the
                // local file storage folder does not exist until something writes to it.
                'mkdir -p "$(dirname "${WEBINY_SQL_FILENAME:-/tmp/unused}")"',
                'mkdir -p "${WEBINY_LOCAL_STORAGE_PATH:-/tmp/unused}"',
                `cd ${API_BUILD_DIR}`,
                "nohup node start.mjs > /tmp/webiny-api.log 2>&1 &",
                `echo "API starting on port ${STANDALONE_API_PORT}"`
            ].join("\n")
        },
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

const printServerLogsStep = {
    name: "Print server logs",
    if: "failure()",
    run: [
        'echo "::group::API log"; cat /tmp/webiny-api.log || true; echo "::endgroup::"',
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
}

/**
 * The unlicensed standalone project lifecycle in one job, shared by the `/e2e` and `push`
 * workflows: Verdaccio, scaffold, build, start, wait for readiness, run the tests, dump logs on
 * failure.
 *
 * The wrapping job supplies what differs between the two - how the repository is checked out, and
 * whether it builds the packages.
 */
export const createStandaloneProjectParts = (
    storageOps: StandaloneStorageOps,
    { workingDirectory, statusLabel, verdaccio, savePlaywrightCache }: StandaloneProjectPartsParams
) => ({
    services: createServices(storageOps),
    steps: [
        ...(verdaccio === "publish"
            ? createPublishToVerdaccioSteps({ workingDirectory })
            : createRestoreVerdaccioSteps({ workingDirectory })),
        ...createBuildStandaloneProjectSteps(storageOps, { workingDirectory }),
        ...createStartStandaloneProjectSteps(storageOps, {}),
        // The same tests the AWS variants run: a freshly created project installs and the admin
        // can sign in.
        ...createInstallationTestSteps({
            workingDirectory,
            adminUrl: STANDALONE_ADMIN_URL,
            artifactName: `e2e-results-standalone-${storageOps}`,
            savePlaywrightCache
        }),
        ...createUnlicensedE2eSteps({
            workingDirectory,
            adminUrl: STANDALONE_ADMIN_URL,
            artifactName: `e2e-test-results-standalone-${storageOps}`
        }),
        ...(statusLabel ? createStatusRowUpdateSteps({ label: statusLabel }) : []),
        printServerLogsStep
    ]
});

/**
 * The `/e2e` command's unlicensed standalone job: PR checkout, packages from the `publish` job,
 * and a row in the PR status comment.
 */
export const createStandaloneJobs = (storageOps: StandaloneStorageOps) => {
    const label = standaloneVariantLabel(storageOps);
    const parts = createStandaloneProjectParts(storageOps, {
        workingDirectory: DIR_WEBINY_JS,
        statusLabel: label,
        verdaccio: "restore"
    });

    return {
        [`e2e-standalone-${storageOps}`]: createJob({
            needs: ["baseBranch", "publish", "checkComment"],
            name: `E2E - ${label}`,
            // Writes the result into the status comment.
            permissions: { "pull-requests": "write" },
            checkout: { path: DIR_WEBINY_JS },
            ...(parts.services ? { services: parts.services } : {}),
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...installSteps,
                ...parts.steps
            ]
        })
    };
};

export interface WcpVariant {
    storageOps: StandaloneStorageOps;
    // How many test jobs split this variant's tests between them (`e2e run --shard i/N`).
    shards: number;
    // `e2e run` arguments that pick the variant's tests, on top of `--exclude-tag installation`.
    selection: string;
}

/**
 * A licensed project running the full `e2e/` suite, split across a matrix of test jobs. A job of
 * its own rather than a license on the regular job, so `/e2e` still covers an unlicensed project
 * for everyone, the AI users included. Its status comment row (wcpVariantCommentRow) only appears
 * on the runs it takes part in.
 *
 * Three jobs:
 * - build: scaffolds and builds the project once, and uploads the API and Admin build folders.
 * - tests: one job per shard. Each starts its own API and Admin from those folders, on its own empty
 *   database, runs the installation test to create the admin user, then its slice of the suite.
 * - result: writes the shards' combined result into the status comment. The shards can't each do
 *   it: they would race on the same row.
 */
export const createWcpStandaloneJobs = ({ storageOps, shards, selection }: WcpVariant) => {
    const label = wcpVariantLabel(storageOps);
    const services = createServices(storageOps);
    const jobKeys = {
        build: `e2e-standalone-${storageOps}-wcp-build`,
        tests: `e2e-standalone-${storageOps}-wcp`,
        result: `e2e-standalone-${storageOps}-wcp-result`
    };
    const buildArchive = `standalone-build-${storageOps}-wcp.tzst`;
    const buildArtifactName = `standalone-build-${storageOps}-wcp`;

    const buildJob = createJob({
        needs: ["baseBranch", "publish", "checkComment"],
        name: `E2E - ${label} - Build`,
        if: AI_E2E_JOB_IF,
        checkout: { path: DIR_WEBINY_JS },
        ...(services ? { services } : {}),
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...yarnCacheSteps,
            ...installSteps,
            ...createRestoreVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...createBuildStandaloneProjectSteps(storageOps, {
                workingDirectory: DIR_WEBINY_JS,
                wcp: true
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
            ...createStartStandaloneProjectSteps(storageOps, { wcp: true }),
            ...createInstallationTestSteps({
                workingDirectory: DIR_WEBINY_JS,
                adminUrl: STANDALONE_ADMIN_URL,
                artifactName: `e2e-results-standalone-${storageOps}-wcp-shard-\${{ matrix.shard }}`
            }),
            ...createAiE2eSteps({
                workingDirectory: DIR_WEBINY_JS,
                artifactName: `ai-e2e-results-standalone-${storageOps}-wcp-shard-\${{ matrix.shard }}`,
                selection: `${selection} --shard \${{ matrix.shard }}/${shards}`.trim()
            }),
            printServerLogsStep
        ]
    });

    const resultJob = createJob({
        needs: ["checkComment", jobKeys.build, jobKeys.tests],
        name: `E2E - ${label}`,
        // Also after a failed or skipped build or shard, which is when the row most needs updating.
        // Not for people outside AI_E2E_USERS: the row doesn't exist in their comment.
        if: `\${{ !cancelled() && needs.checkComment.outputs.comment-id != '' && ${IS_AI_E2E_RUN} }}`,
        // Writes the result into the status comment.
        permissions: { "pull-requests": "write" },
        checkout: false,
        steps: [
            {
                // `needs.<matrix job>.result` is `success` only if every shard passed.
                name: "Check the shards' result",
                env: {
                    BUILD_RESULT: `\${{ needs.${jobKeys.build}.result }}`,
                    TESTS_RESULT: `\${{ needs.${jobKeys.tests}.result }}`
                },
                run: [
                    'echo "build: $BUILD_RESULT, tests: $TESTS_RESULT"',
                    '[ "$TESTS_RESULT" = "success" ]'
                ].join("\n")
            },
            ...createStatusRowUpdateSteps({ label })
        ]
    });

    return {
        [jobKeys.build]: buildJob,
        [jobKeys.tests]: testsJob,
        [jobKeys.result]: resultJob
    };
};
