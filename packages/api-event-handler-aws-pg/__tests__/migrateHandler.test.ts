import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createAwsPgApiHandler, createAwsPgMigrateHandler } from "~/index.js";
import { startPglite } from "./startPglite.js";

/**
 * The deploy-time migration, as a deployment runs it: the api deploy invokes it with `core`, `api`
 * and `scheduler`, the API then runs with `WEBINY_SQL_SCHEMA_MANAGED=true`, and the admin deploy
 * invokes it again with `admin` alone.
 *
 * The tests run in order on one database, each step on what the steps before it left. PGlite serves
 * one connection at a time, so the API's connection is closed before the migration runs again.
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

/** Every table, column, index, function and trigger in the database, sorted. */
const readCatalog = async (knex: Knex): Promise<string[]> => {
    const result = await knex.raw(`
        SELECT 'table ' || tablename AS item FROM pg_tables WHERE schemaname = 'public'
        UNION ALL
        SELECT 'column ' || table_name || '.' || column_name || ' ' || data_type
            FROM information_schema.columns WHERE table_schema = 'public'
        UNION ALL
        SELECT 'index ' || indexname FROM pg_indexes WHERE schemaname = 'public'
        UNION ALL
        SELECT 'function ' || p.proname FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
        UNION ALL
        SELECT 'trigger ' || t.tgname FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND NOT t.tgisinternal
    `);
    return result.rows.map((row: { item: string }) => row.item).sort();
};

const readManifestRows = async (knex: Knex) => {
    const rows: { name: string; manifest: string }[] = await knex("webiny_service_manifests")
        .select("name", "manifest")
        .orderBy("name");
    return rows;
};

const DDL = /^\s*(create|alter|drop|comment)\s/i;

describe("api-event-handler-aws-pg — migrate handler", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>>;
    /** A connection the test reads the database with; closed before every migration. */
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
     * The migrate handler as a deployment builds it: its own connection from the `WEBINY_PG_*`
     * settings, to the writer (`WEBINY_PG_WRITER_HOST`), not to `WEBINY_PG_HOST`.
     */
    const migrate = async (event?: Parameters<ReturnType<typeof createAwsPgMigrateHandler>>[0]) => {
        await closeInspector();
        return createAwsPgMigrateHandler({ extensions: () => [] })(event);
    };

    beforeAll(async () => {
        pglite = await startPglite();
        for (const [name, value] of Object.entries(pglite.env)) {
            vi.stubEnv(name, value);
        }
        vi.stubEnv("WEBINY_PG_WRITER_HOST", pglite.env.WEBINY_PG_HOST);
        // The API's host: the migration must not use it (nothing answers there).
        vi.stubEnv("WEBINY_PG_HOST", "unreachable.invalid");
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
        const result = await migrate({ serviceManifests: deployedManifests });

        expect(result).toEqual({
            ok: true,
            done: [
                "core and audit log tables",
                "CMS models and groups",
                "CMS entries, search, scopes and value counts",
                "ACO folder catalog",
                "websocket connections",
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

        const result = await migrate({ serviceManifests: deployedManifests });

        expect(result.ok).toBe(true);
        expect(await readCatalog(inspect())).toEqual(catalogAfterFirstRun);
        expect(await readManifestRows(inspect())).toEqual(manifestsBefore);
    });

    it("lets the API install and serve the CMS with WEBINY_SQL_SCHEMA_MANAGED=true", async () => {
        vi.stubEnv("WEBINY_SQL_SCHEMA_MANAGED", "true");
        await closeInspector();
        const knex = pglite.createKnex();
        const statements: string[] = [];
        knex.on("query", (query: { sql: string }) => statements.push(query.sql));

        try {
            let requestId = 0;
            const send = async (
                path: string,
                query: string,
                variables: Record<string, unknown> = {}
            ) => {
                // A handler per request, as a new execution environment would build it.
                const handler = createAwsPgApiHandler({
                    extensions: () => [grantFullAccess],
                    knex
                });
                requestId++;
                const result = await handler({
                    httpMethod: "POST",
                    path,
                    headers: { "content-type": "application/json", "x-tenant": "root" },
                    requestContext: { requestId: `schema-managed-${requestId}` },
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

            // The API changed no schema: everything it used was there after the migration.
            expect(statements.filter(sql => DDL.test(sql))).toEqual([]);
            expect(await readCatalog(knex)).toEqual(catalogAfterFirstRun);
        } finally {
            await knex.destroy();
            vi.stubEnv("WEBINY_SQL_SCHEMA_MANAGED", "");
        }
    });

    it("gives service discovery the manifests the deployment passed", async () => {
        expect(await readServiceDiscovery()).toEqual(MANIFESTS);
    });

    it("stores `admin` alone and leaves `core`, `api` and `scheduler` as they were", async () => {
        const deployedRows = await readManifestRows(inspect());

        const result = await migrate({
            serviceManifests: [{ name: "admin", manifest: ADMIN_MANIFEST }]
        });
        expect(result.done).toContain("service manifests: admin");

        const rows = await readManifestRows(inspect());
        expect(rows.filter(row => row.name !== "admin")).toEqual(deployedRows);
        expect(await readServiceDiscovery()).toEqual({ ...MANIFESTS, admin: ADMIN_MANIFEST });

        // A later admin deploy replaces `admin`, and still nothing else.
        const changedAdmin = { url: "https://admin.example.org" };
        await migrate({ serviceManifests: [{ name: "admin", manifest: changedAdmin }] });

        expect((await readManifestRows(inspect())).filter(row => row.name !== "admin")).toEqual(
            deployedRows
        );
        expect(await readServiceDiscovery()).toEqual({ ...MANIFESTS, admin: changedAdmin });
    });

    it("leaves every manifest as it was when it's given none", async () => {
        const rowsBefore = await readManifestRows(inspect());

        const result = await migrate();

        expect(result.done.some(line => line.startsWith("service manifests"))).toBe(false);
        expect(await readManifestRows(inspect())).toEqual(rowsBefore);
    });

    it("refuses a bad idle_session_timeout before it changes anything", async () => {
        vi.stubEnv("WEBINY_PG_IDLE_SESSION_TIMEOUT_MS", "ten minutes");
        try {
            await expect(migrate()).rejects.toThrow(
                'WEBINY_PG_IDLE_SESSION_TIMEOUT_MS must be a whole number of milliseconds (0 turns it off), not "ten minutes".'
            );
        } finally {
            vi.stubEnv("WEBINY_PG_IDLE_SESSION_TIMEOUT_MS", "");
        }
    });

    /**
     * What service discovery reads, as the API wires it: an API handler serves a request (its
     * storage points service discovery at its connection), then the manifests are loaded fresh.
     */
    const readServiceDiscovery = async () => {
        await closeInspector();
        const knex = pglite.createKnex();
        try {
            const handler = createAwsPgApiHandler({ extensions: () => [], knex });
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
