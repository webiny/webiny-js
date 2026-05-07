import { createServer, RoutePlugin } from "@webiny/handler-node";
import { createDatabase, migrate } from "@webiny/db-sqlite";
import { createApiCoreSqlite } from "@webiny/api-core-sqlite";
import { createApiCore } from "@webiny/api-core";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { registerSqliteCmsStorageOperations } from "@webiny/api-headless-cms-sqlite";
import { createFileManagerFs } from "@webiny/api-file-manager-fs";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerAco } from "@webiny/api-file-manager-aco";
import { createAco } from "@webiny/api-aco";
import { createAcoStorageOperationsSqlite } from "@webiny/api-aco-sqlite";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { createSqliteAuditLogStorage } from "@webiny/api-audit-logs-sqlite";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";
import { createWorkflows } from "@webiny/api-workflows";
import { createHeadlessCmsWorkflows } from "@webiny/api-headless-cms-workflows";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { createWebsiteBuilderWorkflows } from "@webiny/api-website-builder-workflows";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks";
import { createBackgroundTasks } from "@webiny/api-background-tasks-ddb";
import { createWebsockets } from "@webiny/api-websockets";
import { MemoryConnectionRegistry, NoopTransport } from "@webiny/api-websockets-memory";
import { createScheduler } from "@webiny/api-scheduler";
import { NodeSchedulerService } from "@webiny/api-scheduler-cron";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createWebsiteBuilderScheduler } from "@webiny/api-website-builder-scheduler";
import graphqlPlugins from "@webiny/handler-graphql";

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const SQLITE_FILE = process.env.SQLITE_FILE ?? ":memory:";
const FILES_DIR = process.env.FILES_DIR ?? "/data/files";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "";

// Wrapped in an IIFE because Rspack bundles `require()`-based dependencies
// alongside our ESM source; mixing top-level await with bundled require()
// makes Node unable to determine the module format. The IIFE keeps every
// `await` strictly local to an async function.
const main = async () => {
    // -----------------------------------------------------------------------
    // Database
    // -----------------------------------------------------------------------
    const database = createDatabase({ filename: SQLITE_FILE });
    migrate(database.sqlite);

    const storageOperations = createApiCoreSqlite({ db: database });

    // -----------------------------------------------------------------------
    // Bootstrap — make sure the root tenant exists on first boot. The
    // api-core flow expects `tenant=root` to resolve for unauthenticated
    // bootstrapping requests; without this the install GraphQL routes never
    // become reachable. Idempotent — safe on every container start.
    // -----------------------------------------------------------------------
    const existingRoot = await storageOperations.tenancyStorageOperations.getTenantsByIds(["root"]);
    if (existingRoot.length === 0) {
        const now = new Date().toISOString();
        await storageOperations.tenancyStorageOperations.createTenant({
            id: "root",
            name: "Root",
            description: "",
            status: "enabled",
            isInstalled: false,
            settings: {},
            tags: [],
            parent: null,
            createdOn: now,
            savedOn: now
        });
        console.log("Bootstrapped root tenant.");
    }

    // -----------------------------------------------------------------------
    // Server — api-core context (tenancy, security, adminUsers, KV) over the
    // SQLite storage layer, plus the GraphQL handler and a /tenants
    // diagnostic route that exercises the storage layer end-to-end. Keycloak
    // OIDC env vars are wired in docker-compose; registering an
    // OidcIdentityProvider for the realm is the next slice of work.
    // -----------------------------------------------------------------------
    const server = createServer({
        plugins: [
            createApiCore({ storageOperations }),
            graphqlPlugins(),

            // Headless CMS — SQLite-backed. Stage 6 ships full Group + Model
            // CRUD plus basic Entry CRUD; revision lifecycle / publish /
            // moveToBin are deferred to stage 6b.
            registerSqliteCmsStorageOperations({ db: database }),
            createHeadlessCmsContext(),
            createHeadlessCmsGraphQL(),

            // File Manager — local-filesystem driver. Bytes are written to
            // FILES_DIR (mounted volume in docker-compose). Multi-part /
            // thumbnails / threat detection are out of scope for stage 7.
            createFileManagerFs({
                uploadDir: FILES_DIR,
                baseUrl: PUBLIC_BASE_URL
            }),

            // ACO — uses the storageOperationsFactory hook added in stage 8;
            // the factory returns SQLite-backed FLP ops + CMS-delegating
            // filter ops.
            createAco({
                storageOperationsFactory: createAcoStorageOperationsSqlite(database)
            }),

            // Record Locking — built on top of the Headless CMS, so it works
            // with whatever storage backend the CMS uses (SQLite here).
            // Zero changes needed.
            createRecordLocking(),

            // Audit Logs — uses the new `storage` injection added to
            // api-audit-logs in stage 9 / cluster 2. SQLite IStorage backs
            // store + fetch fully; list filters fall back to scan-and-filter
            // (DDB uses 10 GSIs; we don't have GSI2-10 in the single-table
            // schema). Acceptable for POC volumes.
            createAuditLogs({
                deleteLogsAfterDays: undefined,
                storage: createSqliteAuditLogStorage(database)
            }),

            // ----- Cluster 3: plugins with no DDB coupling, just wired in -----
            // The File Manager core, ACO bridges, mailer, workflows, website
            // builder, and HCMS task plugins all delegate to the CMS / KV
            // store / etc. — so they work as-is against the SQLite-backed
            // storage layer. Confirmed by `grep documentClient` returning
            // zero hits in each package's source.
            createFileManagerContext(),
            createFileManagerGraphQL(),
            createFileManagerAco(),
            createAcoHcmsContext(),
            createMailerContext(),
            createMailerGraphQL(),
            createWorkflows(),
            createHeadlessCmsWorkflows(),
            createWebsiteBuilder(),
            createWebsiteBuilderWorkflows(),
            createHcmsTasks(),
            createBackgroundTasks(),

            // WebSockets — uses the registry + transport injection added
            // to api-websockets in stage 10 / cluster 10a. In-memory
            // connection registry (single-process Map) + no-op transport
            // (real WS server via @fastify/websocket is a follow-on slice).
            createWebsockets({
                registry: new MemoryConnectionRegistry(),
                transport: new NoopTransport()
            }),

            // Scheduler — uses the schedulerService injection added to
            // api-scheduler in stage 10 / cluster 10b. NodeSchedulerService
            // arms setTimeout-backed timers in-process; firing currently
            // logs (the runtime dispatch back into the scheduled-action
            // event handler is a follow-on). With this in place the CMS
            // and website-builder scheduler plugins (which only consume
            // the SchedulerService abstraction) also boot clean.
            createScheduler({
                schedulerService: new NodeSchedulerService()
            }),
            createHeadlessCmsScheduler(),
            createWebsiteBuilderScheduler(),

            new RoutePlugin(({ onGet }) => {
                onGet("/tenants", async (_, reply) => {
                    const tenants = await storageOperations.tenancyStorageOperations.listTenants();
                    return reply.send({ tenants });
                });
            })
        ],
        host: HOST,
        port: PORT,
        options: { logger: { level: process.env.LOG_LEVEL ?? "info" } }
    });

    const url = await server.listen();
    console.log(`Webiny container API listening on ${url}`);
};

main().catch(err => {
    console.error("Fatal error during server startup:", err);
    process.exit(1);
});
