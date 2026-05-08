import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import { createServer, RoutePlugin } from "@webiny/handler-node";
import { createModifyFastifyPlugin } from "@webiny/handler";
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
import {
    FastifyWebsocketsTransport,
    MemoryConnectionRegistry,
    mountFastifyWebsockets
} from "@webiny/api-websockets-memory";
import { createScheduler } from "@webiny/api-scheduler";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import { NodeSchedulerService } from "@webiny/api-scheduler-cron";
import type { NodeScheduledFireEvent } from "@webiny/api-scheduler-cron";
import type { NodeServer } from "@webiny/handler-node";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createWebsiteBuilderScheduler } from "@webiny/api-website-builder-scheduler";
import graphqlPlugins from "@webiny/handler-graphql";
import { authenticateUsingHttpHeader } from "@webiny/api-core/legacy/security/plugins/authenticateUsingHttpHeader.js";
import { createKeycloakAuth } from "./keycloakAuth.js";
import { createInMemoryDb } from "./inMemoryDb.js";

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const SQLITE_FILE = process.env.SQLITE_FILE ?? ":memory:";
const FILES_DIR = process.env.FILES_DIR ?? "/data/files";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "";
// Where the prebuilt Admin SPA bundle lives — Dockerfile copies
// extensions/admin/build/ into /app/admin. Unset (or pointing at a
// missing path) disables the static plugin entirely; explicit API
// routes keep working.
const ADMIN_BUILD_DIR = process.env.ADMIN_BUILD_DIR ?? "/app/admin";

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

    // WebSockets registry + transport — instantiated up-front so the
    // websockets ContextPlugin (createWebsockets) and the Fastify mount
    // (mountFastifyWebsockets) share the same instances.
    const wsRegistry = new MemoryConnectionRegistry();
    const wsTransport = new FastifyWebsocketsTransport();

    // Scheduler dispatch — late-bound because the Fastify instance
    // doesn't exist yet when NodeSchedulerService is constructed. The
    // onFire callback synthesizes a POST to /webiny-scheduler-internal
    // via app.inject() so the dispatch runs through Webiny's full
    // preHandler chain (tenancy, per-request ALS) before
    // ExecuteScheduledActionUseCase resolves and runs. Mirrors the
    // WebSocket dispatch pattern.
    let appRef: NodeServer["app"] | undefined;
    const dispatchScheduledAction = async (event: NodeScheduledFireEvent): Promise<void> => {
        if (!appRef) {
            // Pre-server fire shouldn't happen in practice — schedules
            // are armed via the SchedulerService context plugin which
            // only runs once the server is wiring up. Log instead of
            // dropping silently.
            console.warn(
                `Scheduler fired before Fastify ready: id=${event.id} namespace=${event.namespace}`
            );
            return;
        }
        try {
            await appRef.inject({
                method: "POST",
                url: "/webiny-scheduler-internal",
                headers: { "x-tenant": "root", "content-type": "application/json" },
                payload: { namespace: event.namespace, id: event.id }
            });
        } catch (err) {
            console.error(`Scheduler dispatch failed for id=${event.id}:`, (err as Error).message);
        }
    };
    const schedulerService = new NodeSchedulerService({ onFire: dispatchScheduledAction });

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
    // Bootstrap — Webiny admin-user record matching the seeded Keycloak
    // user (`admin@webiny.local`). The container's KeycloakIdpConfig
    // returns the email as the Webiny identity id, so this row is what
    // authorize-by-id queries match against. Without it the api validates
    // the Keycloak token but every authorized GraphQL operation fails to
    // find a matching user record.
    //
    // POC limitation: only the seeded admin works this way. A
    // production-grade flow would JIT-provision new external users on
    // first login (the IdentityData `external: true` flag is the hook).
    // -----------------------------------------------------------------------
    // Bootstrap the `full-access` role on the root tenant. The serverless
    // path creates this via RolesInstaller during the install GraphQL
    // flow. The container POC skips the install flow entirely (admin is
    // pre-provisioned), so we have to seed the role ourselves — without
    // it, the GroupsTeamsAuthorizer returns null permissions and the
    // Admin UI's LogInUseCase throws "You have no permissions on this
    // tenant!".
    const FULL_ACCESS_ROLE_ID = "full-access";
    const existingFullAccess = await storageOperations.securityStorageOperations.getRole({
        where: { tenant: "root", id: FULL_ACCESS_ROLE_ID }
    });
    if (!existingFullAccess) {
        const now = new Date().toISOString();
        await storageOperations.securityStorageOperations.createRole({
            role: {
                id: FULL_ACCESS_ROLE_ID,
                tenant: "root",
                name: "Full Access",
                slug: "full-access",
                description: "Grants full access to all apps.",
                system: true,
                permissions: [{ name: "*" }],
                createdOn: now,
                createdBy: null
            }
        });
        console.log("Bootstrapped full-access role on root tenant.");
    }

    const ADMIN_EMAIL = "admin@webiny.local";
    const existingAdmin = await storageOperations.usersStorageOperations.getUser({
        where: { id: ADMIN_EMAIL, tenant: "root" }
    });
    if (!existingAdmin) {
        const now = new Date().toISOString();
        await storageOperations.usersStorageOperations.createUser({
            user: {
                id: ADMIN_EMAIL,
                tenant: "root",
                displayName: "Webiny Admin",
                email: ADMIN_EMAIL,
                firstName: "Webiny",
                lastName: "Admin",
                roles: [FULL_ACCESS_ROLE_ID],
                createdOn: now,
                createdBy: null,
                external: true
            }
        });
        console.log(`Bootstrapped admin user ${ADMIN_EMAIL}.`);
    } else if (!(existingAdmin.roles ?? []).includes(FULL_ACCESS_ROLE_ID)) {
        // Pre-existing admin user from an older container build (before the
        // role bootstrap landed) — patch the role list in place so the
        // rest of the auth flow works without a volume wipe.
        await storageOperations.usersStorageOperations.updateUser({
            user: {
                ...existingAdmin,
                roles: [...(existingAdmin.roles ?? []), FULL_ACCESS_ROLE_ID]
            }
        });
        console.log(`Patched admin user ${ADMIN_EMAIL} with full-access role.`);
    }

    // -----------------------------------------------------------------------
    // Bootstrap — File Manager `srcPrefix` so the Admin UI can build
    // image URLs as `${srcPrefix}${file.key}`. The serverless install
    // flow seeds this from CloudFront's domain; the container POC
    // skips installation, so we have to seed it ourselves. Without it
    // file URLs come out as bare keys (e.g. `<uuid>.png`) and the
    // browser resolves them against the current page path.
    // -----------------------------------------------------------------------
    const FILE_MANAGER_SETTINGS_KEY = "FileManager/General";
    const fmDefaultSrcPrefix = `${PUBLIC_BASE_URL || "http://localhost:8080"}/files/`;
    const existingFmSettings = await storageOperations.keyValueStorageOperations.get(
        FILE_MANAGER_SETTINGS_KEY,
        "root"
    );
    if (!existingFmSettings) {
        await storageOperations.keyValueStorageOperations.set(
            FILE_MANAGER_SETTINGS_KEY,
            {
                uploadMinFileSize: 0,
                uploadMaxFileSize: 10737418240,
                srcPrefix: fmDefaultSrcPrefix
            },
            "root"
        );
        console.log(`Bootstrapped File Manager settings (srcPrefix=${fmDefaultSrcPrefix}).`);
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
            // Process-local in-memory `context.db` — backs the legacy
            // `@webiny/db` store API used by api-headless-cms-tasks
            // (deleteModel CRUD) and others. Without it, isBeingDeleted
            // and similar resolvers crash and mark every model as
            // "being deleted" via their fall-back paths.
            createInMemoryDb(),
            createKeycloakAuth(),
            // Reads the `Authorization: Bearer <jwt>` header on every
            // request and runs context.security.authenticate(token).
            // Without this the JwtAuthenticator never fires and every
            // request stays anonymous.
            authenticateUsingHttpHeader(),
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

            // WebSockets — registry + Fastify-backed transport for the
            // long-lived container. The transport holds the live socket
            // map; mountFastifyWebsockets (below) attaches /ws and
            // populates the map on connect.
            createWebsockets({
                registry: wsRegistry,
                transport: wsTransport
            }),

            // Scheduler — NodeSchedulerService arms setTimeout-backed
            // timers in-process; on fire, dispatchScheduledAction
            // synthesizes a POST to /webiny-scheduler-internal so the
            // standard preHandler chain runs before
            // ExecuteScheduledActionUseCase loads + runs the action.
            createScheduler({ schedulerService }),
            createHeadlessCmsScheduler(),
            createWebsiteBuilderScheduler(),

            new RoutePlugin(({ onGet }) => {
                onGet("/tenants", async (_, reply) => {
                    const tenants = await storageOperations.tenancyStorageOperations.listTenants();
                    return reply.send({ tenants });
                });
            }),

            // Internal scheduler dispatch route — fired via app.inject()
            // from dispatchScheduledAction (the NodeSchedulerService
            // onFire callback). Goes through the full preHandler chain
            // so tenancy + per-request ALS are populated before
            // ExecuteScheduledActionUseCase runs.
            new RoutePlugin(({ onPost, context }) => {
                onPost("/webiny-scheduler-internal", async (request, reply) => {
                    const body = request.body as { namespace: string; id: string };
                    const usecase = context.container.resolve(ExecuteScheduledActionUseCase);
                    const result = await usecase.execute(body);
                    if (result.isFail()) {
                        const err = result.error;
                        console.error(`Scheduled action ${body.id} failed:`, err.code, err.message);
                        return reply.send({ ok: false, code: err.code, message: err.message });
                    }
                    return reply.send({ ok: true });
                });
            }),

            // Real WebSocket endpoint — accepts upgrades at /ws, parses
            // ?token+?tenant from the connect query, and dispatches
            // $connect / $default / $disconnect events through the full
            // Webiny preHandler chain (auth + tenancy + per-request
            // ALS). FastifyWebsocketsTransport (registered via
            // createWebsockets above) writes server-initiated payloads
            // back to the live ws sockets.
            createModifyFastifyPlugin(async app => {
                await mountFastifyWebsockets({
                    app,
                    transport: wsTransport,
                    registry: wsRegistry
                });
            }),

            // Admin SPA — served from the same Fastify process so the
            // container is fully self-contained (no nginx/CloudFront in
            // POC). Registered last via ModifyFastifyPlugin so explicit
            // API routes (/graphql, /health, /tenants) keep winning.
            // setNotFoundHandler sends index.html for any unmatched HTML
            // request so the admin's client-side router can take over
            // for deep links like /cms/content-models.
            createModifyFastifyPlugin(app => {
                if (!existsSync(ADMIN_BUILD_DIR)) {
                    app.log.warn(
                        { adminBuildDir: ADMIN_BUILD_DIR },
                        "ADMIN_BUILD_DIR does not exist — admin SPA will not be served"
                    );
                    return;
                }
                app.register(fastifyStatic, {
                    root: ADMIN_BUILD_DIR,
                    prefix: "/",
                    wildcard: false
                });
                app.setNotFoundHandler((request, reply) => {
                    const accepts = request.headers.accept ?? "";
                    if (request.method === "GET" && accepts.includes("text/html")) {
                        return reply.sendFile("index.html");
                    }
                    return reply.code(404).send({
                        message: `Route ${request.method}:${request.url} not found`,
                        error: "Not Found",
                        statusCode: 404
                    });
                });
            })
        ],
        host: HOST,
        port: PORT,
        options: { logger: { level: process.env.LOG_LEVEL ?? "info" } }
    });

    // Late-bind the scheduler dispatch target now that Fastify exists.
    // dispatchScheduledAction (built up-front, captured in
    // schedulerService.onFire) reads this through the closure.
    appRef = server.app;

    const url = await server.listen();
    console.log(`Webiny container API listening on ${url}`);
};

main().catch(err => {
    console.error("Fatal error during server startup:", err);
    process.exit(1);
});
