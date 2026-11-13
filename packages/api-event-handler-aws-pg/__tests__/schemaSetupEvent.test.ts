import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import knexLib, { type Knex } from "knex";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createWebinyApiHandler } from "@webiny/api-event-handler-aws";
import { createPgStorage } from "@webiny/api-storage-pg";
import {
    createAwsPgApiHandler,
    SQL_SCHEMA_SETUP_EVENT_IDENTIFIER,
    type ISqlSchemaSetupEventPayload,
    type ISqlSchemaSetupResult
} from "~/index.js";
import { postgresModules, startPglite } from "./startPglite.js";
import { readCatalog } from "./readCatalog.js";

/**
 * The deploy-time schema setup, as a deployment runs it: it invokes the API's own function with the
 * schema-setup event. The api deploy passes `core`, `api` and `scheduler`, the API then runs
 * schema-managed (it never checks for or creates tables), and the admin deploy invokes it again
 * with `admin` alone.
 *
 * The tests run in order on one database, each step on what the steps before it left. PGlite serves
 * one connection at a time, so the API's connection is closed before the setup runs again.
 */

const MANIFESTS = {
    core: { region: "eu-central-1", fileManagerBucket: "core-bucket" },
    api: { graphqlUrl: "https://api.example.com/graphql" },
    scheduler: { lambdaArn: "arn:aws:lambda:eu-central-1:000000000000:function:scheduler" }
};
const ADMIN_MANIFEST = { url: "https://admin.example.com" };

const deployedManifests = Object.entries(MANIFESTS).map(([name, manifest]) => ({
    name,
    manifest
}));

class FullAccess implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[]> {
        return [{ name: "*" }];
    }
}

const grantFullAccess = createRegisterExtensionPlugin(({ container }) => {
    container.register(
        Authorizer.createImplementation({ implementation: FullAccess, dependencies: [] })
    );
});

const readManifestRows = async (knex: Knex) => {
    const rows: { name: string; manifest: string }[] = await knex("webiny_service_manifests")
        .select("name", "manifest")
        .orderBy("name");
    return rows;
};

const DDL = /^\s*(create|alter|drop|comment)\s/i;

/** Every statement `knex` runs from now on. */
const recordStatements = (knex: Knex): string[] => {
    const statements: string[] = [];
    knex.on("query", (query: { sql: string }) => statements.push(query.sql));
    return statements;
};

/**
 * Forgets what the storage knows about the database it last used (verified tables, CMS scopes):
 * process-wide caches, keyed by table name. One API process has one database; a test that switches
 * to another one resets them first, as the SQL test setups do between tests.
 */
const resetStorageCaches = () => {
    const managers = ((globalThis as Record<string, unknown>).__sqlTableManagers ?? []) as {
        reset(): void;
    }[];
    for (const manager of managers) {
        manager.reset();
    }
};

type ApiHandler = ReturnType<typeof createAwsPgApiHandler>;

/**
 * Installs the system, creates a content model and an entry, publishes it and lists it on
 * /cms/read and /cms/preview. Each request gets a handler of its own from `createHandler`, as a new execution
 * environment would build it.
 */
const installAndServeCms = async (createHandler: () => ApiHandler) => {
    let requestId = 0;
    const send = async (path: string, query: string, variables: Record<string, unknown> = {}) => {
        requestId++;
        const result = await createHandler()({
            httpMethod: "POST",
            path,
            headers: { "content-type": "application/json", "x-tenant": "root" },
            requestContext: { requestId: `cms-${requestId}` },
            body: JSON.stringify({ query, variables }),
            isBase64Encoded: false
        });
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(String(result.body));
        expect(body.errors).toBeUndefined();
        return body.data;
    };

    const before = await send("/graphql", IS_INSTALLED);
    expect(before.system.isSystemInstalled).toEqual({ data: false, error: null });

    const install = await send("/graphql", INSTALL, { installationInput: [] });
    expect(install.system.installSystem).toEqual({ data: true, error: null });

    const group = await send("/cms/manage", CREATE_GROUP, {
        data: {
            name: "Notes",
            slug: "notes",
            icon: { type: "emoji", name: "note", value: "📝" },
            description: "Notes"
        }
    });
    expect(group.createContentModelGroup.error).toBeNull();

    const model = await send("/cms/manage", CREATE_MODEL, {
        data: {
            name: "Note",
            modelId: "note",
            singularApiName: "Note",
            pluralApiName: "Notes",
            group: "notes",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    storageId: "text@title",
                    type: "text",
                    label: "Title",
                    renderer: { name: "text-input" }
                }
            ],
            layout: [["title"]],
            titleFieldId: "title"
        }
    });
    expect(model.createContentModel.error).toBeNull();

    const created = await send("/cms/manage", CREATE_NOTE, {
        data: { values: { title: "Schema managed" } }
    });
    expect(created.createNote.error).toBeNull();
    const published = await send("/cms/manage", PUBLISH_NOTE, {
        revision: created.createNote.data.id
    });
    expect(published.publishNote.error).toBeNull();

    const read = await send("/cms/read", LIST_NOTES);
    expect(read.listNotes.error).toBeNull();
    expect(
        read.listNotes.data.map((note: { values: { title: string } }) => note.values.title)
    ).toEqual(["Schema managed"]);

    const preview = await send("/cms/preview", LIST_NOTES);
    expect(preview.listNotes.error).toBeNull();
    expect(
        preview.listNotes.data.map((note: { values: { title: string } }) => note.values.title)
    ).toEqual(["Schema managed"]);
};

describe("api-event-handler-aws-pg — schema-setup event", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>>;
    /** A connection the test reads the database with; closed before every setup. */
    let inspector: Knex | undefined;

    const inspect = () => {
        inspector ??= pglite.createKnex();
        return inspector;
    };

    const closeInspector = async () => {
        await inspector?.destroy();
        inspector = undefined;
    };

    /**
     * The API's function as a deployment builds it, invoked with the schema-setup event. Its
     * connections come from the `WEBINY_PG_*` settings: the setup's goes to the writer
     * (`WEBINY_PG_WRITER_HOST`), not to the API's `WEBINY_PG_HOST`.
     */
    const runSetup = async (
        payload: ISqlSchemaSetupEventPayload = {}
    ): Promise<ISqlSchemaSetupResult> => {
        await closeInspector();
        const handler = createAwsPgApiHandler({ extensions: () => postgresModules });
        return handler({ [SQL_SCHEMA_SETUP_EVENT_IDENTIFIER]: payload });
    };

    beforeAll(async () => {
        pglite = await startPglite();
        for (const [name, value] of Object.entries(pglite.env)) {
            vi.stubEnv(name, value);
        }
        vi.stubEnv("WEBINY_PG_WRITER_HOST", pglite.env.WEBINY_PG_HOST);
        // The API's host: the setup must not run on it (nothing answers there).
        vi.stubEnv("WEBINY_PG_HOST", "unreachable.invalid");
        // Nor wait for it, except in the tests of that wait.
        vi.stubEnv("WEBINY_PG_API_WAIT_MS", "0");
        vi.stubEnv("WEBINY_PG_PASSWORD", "postgres");
        vi.stubEnv("WEBINY_PG_RETRY_MS", "0");
    });

    afterEach(() => {
        ServiceDiscovery.clear();
    });

    afterAll(async () => {
        await closeInspector();
        await pglite.stop();
        vi.unstubAllEnvs();
    });

    let catalogAfterFirstRun: string[];

    it("creates the schema, sets idle_session_timeout and stores the deployed manifests", async () => {
        const result = await runSetup({ serviceManifests: deployedManifests });

        expect(result).toEqual({
            ok: true,
            done: [
                "core",
                "auditLogs",
                "websockets",
                "cms",
                "aco",
                "idle_session_timeout 600000 ms",
                "service manifests: core, api, scheduler"
            ]
        });

        catalogAfterFirstRun = await readCatalog(inspect());
        expect(catalogAfterFirstRun).toEqual(
            expect.arrayContaining([
                "table webiny_service_manifests",
                expect.stringMatching(/^table .*webiny_cms_entries$/),
                expect.stringMatching(/^table .*webiny_aco_folders$/)
            ])
        );

        const role = await inspect().raw(
            "SELECT rolconfig FROM pg_roles WHERE rolname = current_user"
        );
        expect(role.rows[0].rolconfig).toContain("idle_session_timeout=600000");
    });

    it("succeeds again and creates nothing new", async () => {
        const manifestsBefore = await readManifestRows(inspect());

        const result = await runSetup({ serviceManifests: deployedManifests });

        expect(result.ok).toBe(true);
        expect(await readCatalog(inspect())).toEqual(catalogAfterFirstRun);
        expect(await readManifestRows(inspect())).toEqual(manifestsBefore);
    });

    it("lets the schema-managed API install and serve the CMS without changing the schema", async () => {
        await closeInspector();
        const knex = pglite.createKnex();
        const statements = recordStatements(knex);

        try {
            await installAndServeCms(() => {
                return createAwsPgApiHandler({
                    extensions: () => [...postgresModules, grantFullAccess],
                    knex
                });
            });

            // The API changed no schema: everything it used was there after the setup.
            expect(statements.filter(sql => DDL.test(sql))).toEqual([]);
            expect(await readCatalog(knex)).toEqual(catalogAfterFirstRun);
        } finally {
            await knex.destroy();
        }
    });

    it("sees the API create tables when the schema isn't managed (the control)", async () => {
        // A database of its own, with no setup: the same storage, schema-managed off, creates
        // each table on first use, and the test above would see it.
        const empty = await startPglite();
        const knex = empty.createKnex();
        const statements = recordStatements(knex);
        resetStorageCaches();

        try {
            await installAndServeCms(() => {
                return createWebinyApiHandler({
                    extensions: () => [...postgresModules, grantFullAccess],
                    registerRootStorage: async container => {
                        // No setup ran on this storage, so it isn't schema-managed.
                        await createPgStorage({ knex }).register(container);
                    }
                });
            });

            expect(statements.filter(sql => DDL.test(sql)).length).toBeGreaterThan(0);
            expect(await readCatalog(knex)).toEqual(
                expect.arrayContaining([expect.stringMatching(/^table .*webiny_cms_entries$/)])
            );
        } finally {
            await knex.destroy();
            await empty.stop();
            resetStorageCaches();
        }
    });

    it("gives service discovery the manifests the deployment passed", async () => {
        expect(await readServiceDiscovery()).toEqual(MANIFESTS);
    });

    it("stores `admin` alone and leaves `core`, `api` and `scheduler` as they were", async () => {
        const deployedRows = await readManifestRows(inspect());

        const result = await runSetup({
            serviceManifests: [{ name: "admin", manifest: ADMIN_MANIFEST }]
        });
        expect(result.done).toContain("service manifests: admin");

        const rows = await readManifestRows(inspect());
        expect(rows.filter(row => row.name !== "admin")).toEqual(deployedRows);
        expect(await readServiceDiscovery()).toEqual({ ...MANIFESTS, admin: ADMIN_MANIFEST });

        // A later admin deploy replaces `admin`, and still nothing else.
        const changedAdmin = { url: "https://admin.example.org" };
        await runSetup({ serviceManifests: [{ name: "admin", manifest: changedAdmin }] });

        expect((await readManifestRows(inspect())).filter(row => row.name !== "admin")).toEqual(
            deployedRows
        );
        expect(await readServiceDiscovery()).toEqual({ ...MANIFESTS, admin: changedAdmin });
    });

    it("leaves every manifest as it was when it's given none", async () => {
        const rowsBefore = await readManifestRows(inspect());

        const result = await runSetup();

        expect(result.done.some(line => line.startsWith("service manifests"))).toBe(false);
        expect(await readManifestRows(inspect())).toEqual(rowsBefore);
    });

    it("refuses a bad idle_session_timeout before it changes anything", async () => {
        vi.stubEnv("WEBINY_PG_IDLE_SESSION_TIMEOUT_MS", "ten minutes");
        try {
            await expect(runSetup()).rejects.toThrow(
                'WEBINY_PG_IDLE_SESSION_TIMEOUT_MS must be a whole number of milliseconds (0 turns it off), not "ten minutes".'
            );
        } finally {
            vi.stubEnv("WEBINY_PG_IDLE_SESSION_TIMEOUT_MS", "");
        }
    });

    it("refuses a bad WEBINY_PG_API_WAIT_MS before it changes anything", async () => {
        vi.stubEnv("WEBINY_PG_API_WAIT_MS", "-1");
        try {
            await expect(runSetup()).rejects.toThrow(
                'WEBINY_PG_API_WAIT_MS must be a whole number of milliseconds (0 turns it off), not "-1".'
            );
        } finally {
            vi.stubEnv("WEBINY_PG_API_WAIT_MS", "0");
        }
    });

    /**
     * With RDS Proxy the API's `WEBINY_PG_HOST` is the proxy, not the writer. A new proxy refuses
     * connections for a few minutes, so the setup waits until it accepts the API's, or fails the
     * deploy. Here `localhost` stands for the proxy: another host name for the same database.
     */
    describe("waiting for the API's connection", () => {
        const withEnv = async (env: Record<string, string>, run: () => Promise<void>) => {
            for (const [name, value] of Object.entries(env)) {
                vi.stubEnv(name, value);
            }
            try {
                await run();
            } finally {
                vi.stubEnv("WEBINY_PG_HOST", "unreachable.invalid");
                vi.stubEnv("WEBINY_PG_API_WAIT_MS", "0");
            }
        };

        it("waits, by default, until the API's connection through the proxy is accepted", async () => {
            await withEnv({ WEBINY_PG_HOST: "localhost", WEBINY_PG_API_WAIT_MS: "" }, async () => {
                const result = await runSetup();

                expect(result.done.at(-1)).toMatch(
                    /^api connection accepted \(attempt 1, after \d+ s\)$/
                );
            });
        });

        it("doesn't wait when the API connects to the writer", async () => {
            await withEnv(
                { WEBINY_PG_HOST: pglite.env.WEBINY_PG_HOST, WEBINY_PG_API_WAIT_MS: "" },
                async () => {
                    const result = await runSetup();

                    expect(result.done.at(-1)).toBe("idle_session_timeout 600000 ms");
                }
            );
        });

        it("tries again until the API's connection is accepted", async () => {
            await withEnv({ WEBINY_PG_API_WAIT_MS: "1000" }, async () => {
                await closeInspector();
                const opened: string[] = [];
                const handler = createAwsPgApiHandler({
                    extensions: () => postgresModules,
                    createApiKnex: () => {
                        // The first refuses, as a proxy whose target isn't available yet.
                        if (!opened.length) {
                            opened.push("refused");
                            return knexLib({
                                client: "pg",
                                connection: { host: "unreachable.invalid", user: "postgres" }
                            });
                        }
                        opened.push("accepted");
                        return pglite.createKnex();
                    }
                });

                const result = await handler({ [SQL_SCHEMA_SETUP_EVENT_IDENTIFIER]: {} });

                expect(opened).toEqual(["refused", "accepted"]);
                expect(result.done.at(-1)).toMatch(
                    /^api connection accepted \(attempt 2, after \d+ s\)$/
                );
            });
        });

        it("fails the deploy when the API's connection is refused for the whole wait", async () => {
            await withEnv(
                { WEBINY_PG_HOST: "unreachable.invalid", WEBINY_PG_API_WAIT_MS: "1500" },
                async () => {
                    const error = await runSetup().then(
                        () => undefined,
                        (error: Error) => error
                    );

                    expect(error?.message).toMatch(
                        /^The API can't connect to the database: its connection \(WEBINY_PG_HOST\) was refused for 2 s, [2-9] attempts\. Last error: .*unreachable\.invalid.*\. A new RDS Proxy can take a few minutes/
                    );
                    // The setup itself ran: the schema is in place.
                    expect(await readCatalog(inspect())).toEqual(catalogAfterFirstRun);
                }
            );
        });

        it("gives up on an attempt that doesn't answer, when the wait ends", async () => {
            await withEnv({ WEBINY_PG_API_WAIT_MS: "1500" }, async () => {
                await closeInspector();
                const handler = createAwsPgApiHandler({
                    extensions: () => postgresModules,
                    // A proxy that takes the connection and never answers.
                    createApiKnex: () =>
                        ({
                            raw: () => new Promise(() => undefined),
                            destroy: async () => undefined
                        }) as unknown as Knex
                });

                const started = Date.now();
                const error = await handler({ [SQL_SCHEMA_SETUP_EVENT_IDENTIFIER]: {} }).then(
                    () => undefined,
                    (error: Error) => error
                );

                expect(error?.message).toMatch(
                    /^The API can't connect to the database: .* 1 attempts\. Last error: no answer within 2 s\./
                );
                expect(Date.now() - started).toBeLessThan(10_000);
            });
        });

        it("ends the wait before the function would be stopped", async () => {
            // The default wait (10 minutes), on a function with 31.5 s left: 30 s are kept for the
            // setup to return its error, so it waits 1.5 s.
            await withEnv({ WEBINY_PG_API_WAIT_MS: "" }, async () => {
                await closeInspector();
                const handler = createAwsPgApiHandler({
                    extensions: () => postgresModules,
                    createApiKnex: () =>
                        knexLib({
                            client: "pg",
                            connection: { host: "unreachable.invalid", user: "postgres" }
                        })
                });
                const stoppedAt = Date.now() + 31_500;
                const context = {
                    awsRequestId: "schema-setup",
                    getRemainingTimeInMillis: () => stoppedAt - Date.now()
                } as unknown as Context;

                const error = await handler(
                    { [SQL_SCHEMA_SETUP_EVENT_IDENTIFIER]: {} },
                    context
                ).then(
                    () => undefined,
                    (error: Error) => error
                );

                expect(error?.message).toMatch(
                    /^The API can't connect to the database: its connection \(WEBINY_PG_HOST\) was refused for [0-2] s, /
                );
                expect(stoppedAt - Date.now()).toBeGreaterThan(25_000);
            });
        });
    });

    /**
     * What service discovery reads, as the API wires it: an API handler serves a request (its
     * storage points service discovery at its connection), then the manifests are loaded fresh.
     */
    const readServiceDiscovery = async () => {
        await closeInspector();
        const knex = pglite.createKnex();
        try {
            const handler = createAwsPgApiHandler({ extensions: () => postgresModules, knex });
            const result = await handler({
                httpMethod: "POST",
                path: "/graphql",
                headers: { "content-type": "application/json", "x-tenant": "root" },
                requestContext: { requestId: "service-discovery" },
                body: JSON.stringify({ query: "{ __typename }" }),
                isBase64Encoded: false
            });
            expect(result.statusCode).toBe(200);

            ServiceDiscovery.clear();
            return await ServiceDiscovery.load();
        } finally {
            await knex.destroy();
        }
    };
});

const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        system {
            isSystemInstalled {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const INSTALL = /* GraphQL */ `
    mutation Install($installationInput: JSON!) {
        system {
            installSystem(installationInput: $installationInput) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const CREATE_GROUP = /* GraphQL */ `
    mutation CreateGroup($data: CmsContentModelGroupInput!) {
        createContentModelGroup(data: $data) {
            data {
                slug
            }
            error {
                code
                message
                data
            }
        }
    }
`;

const CREATE_MODEL = /* GraphQL */ `
    mutation CreateModel($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data {
                modelId
            }
            error {
                code
                message
                data
            }
        }
    }
`;

const CREATE_NOTE = /* GraphQL */ `
    mutation CreateNote($data: NoteInput!) {
        createNote(data: $data) {
            data {
                id
            }
            error {
                code
                message
                data
            }
        }
    }
`;

const PUBLISH_NOTE = /* GraphQL */ `
    mutation PublishNote($revision: ID!) {
        publishNote(revision: $revision) {
            data {
                id
            }
            error {
                code
                message
                data
            }
        }
    }
`;

const LIST_NOTES = /* GraphQL */ `
    query ListNotes {
        listNotes {
            data {
                values {
                    title
                }
            }
            error {
                code
                message
                data
            }
        }
    }
`;
