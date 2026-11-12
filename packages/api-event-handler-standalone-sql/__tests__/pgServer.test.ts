import { describe, expect, it } from "vitest";
import { acoPg, createPgServer, signingSecret } from "./createPgServer.js";

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

const LOGIN = /* GraphQL */ `
    mutation Login($email: String!, $password: String!) {
        selfHostedAuthLogin(email: $email, password: $password) {
            data {
                token
            }
            error {
                code
                message
            }
        }
    }
`;

const CREATE_FOLDER = /* GraphQL */ `
    mutation CreateFolder($data: FolderCreateInput!) {
        aco {
            createFolder(data: $data) {
                data {
                    id
                    path
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const UPDATE_FOLDER = /* GraphQL */ `
    mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
        aco {
            updateFolder(id: $id, data: $data) {
                data {
                    id
                    path
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const LIST_FOLDERS = /* GraphQL */ `
    query ListFolders($type: String!) {
        aco {
            listFolders(where: { type: $type }, limit: 100) {
                data {
                    id
                    slug
                    path
                }
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

const admin = {
    firstName: "Test",
    lastName: "Admin",
    email: "test-admin@example.com",
    password: "test-admin-password"
};

const tablesLike = async (knex: any, suffix: string): Promise<string[]> => {
    const result = await knex.raw(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE ?",
        [`%${suffix}`]
    );
    return result.rows.map((row: { tablename: string }) => row.tablename);
};

/** Installs the system with the test admin and logs in as them; returns the token. */
const installAndLogIn = async (server: Awaited<ReturnType<typeof createPgServer>>) => {
    const install = await server.graphql(INSTALL, {
        installationInput: [{ app: "SelfHostedAuth", data: admin }]
    });
    expect(install.raw).not.toContain("No registration found");
    expect(install.body.data.system.installSystem).toEqual({ data: true, error: null });

    const login = await server.graphql(LOGIN, { email: admin.email, password: admin.password });
    expect(login.body.data.selfHostedAuthLogin.error).toBeNull();
    return login.body.data.selfHostedAuthLogin.data.token as string;
};

/**
 * The full standalone server on the Postgres storage, as `<Infra.Pglite>` and `<Infra.Postgres>`
 * build it, with the CMS and ACO modules `<HeadlessCmsPg />` and `<AcoPg />` add: the schema is set
 * up at start, then the server runs schema-managed.
 */
describe("api-event-handler-standalone-sql — full server on Postgres", () => {
    it("creates its schema at start, then installs and serves CMS requests with no DDL", async () => {
        const server = await createPgServer();

        try {
            // Before the first request, every table is there: core, audit logs, websockets, the
            // login tables (the transport's storage), the CMS and the folder catalog. The storage
            // was given no extensions: the setup's container was built as a request's.
            const tables = [
                "webiny_service_manifests",
                "webiny_audit_logs",
                "WebsocketsConnections",
                "webiny_self_hosted_credentials",
                "webiny_self_hosted_password_reset_codes",
                "webiny_cms_entries",
                "webiny_aco_folders"
            ];
            for (const table of tables) {
                expect([table, await tablesLike(server.knex, table)]).toEqual([
                    table,
                    [expect.stringMatching(new RegExp(`${table}$`))]
                ]);
            }

            const token = await installAndLogIn(server);
            const send = async (path: string, query: string, variables = {}) => {
                const result = await server.graphql(query, variables, token, path);
                expect(result.statusCode).toBe(200);
                expect(result.body.errors).toBeUndefined();
                return result.body.data;
            };

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
                data: { values: { title: "Set up at start" } }
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
            ).toEqual(["Set up at start"]);

            // Schema-managed after the setup at start: no request changed the schema.
            expect(server.ddlAfterStart()).toEqual([]);
        } finally {
            await server.close();
        }
    });

    it("refuses to start without the CMS module, naming <HeadlessCmsPg />", async () => {
        await expect(createPgServer({ extensions: [signingSecret, acoPg] })).rejects.toThrow(
            "add <HeadlessCmsPg /> (from @webiny/api-headless-cms-pg/project) to webiny.config.tsx"
        );
    });

    it("installs, and stores content in the Postgres-native tables", async () => {
        const server = await createPgServer();

        try {
            const token = await installAndLogIn(server);

            const createFolder = async (data: Record<string, unknown>) => {
                const result = await server.graphql(CREATE_FOLDER, { data }, token);
                expect(result.body.data.aco.createFolder.error).toBeNull();
                return result.body.data.aco.createFolder.data;
            };
            const parent = await createFolder({ title: "Parent", slug: "parent", type: "test" });
            const child = await createFolder({
                title: "Child",
                slug: "child",
                type: "test",
                parentId: parent.id
            });
            expect(child.path).toBe("root/parent/child");

            // A parent's rename rewrites the descendants' paths in the same transaction.
            const renamed = await server.graphql(
                UPDATE_FOLDER,
                { id: parent.id, data: { slug: "renamed" } },
                token
            );
            expect(renamed.body.data.aco.updateFolder.error).toBeNull();

            const list = await server.graphql(LIST_FOLDERS, { type: "test" }, token);
            expect(list.body.data.aco.listFolders.error).toBeNull();
            const paths = list.body.data.aco.listFolders.data.map((folder: any) => folder.path);
            expect(paths.sort()).toEqual(["root/renamed", "root/renamed/child"]);

            // Stored by the Postgres-native storage: entries in its table, folders in the catalog.
            const [entriesTable] = await tablesLike(server.knex, "webiny_cms_entries");
            const [foldersTable] = await tablesLike(server.knex, "webiny_aco_folders");
            expect(entriesTable).toBeDefined();
            expect(foldersTable).toBeDefined();
            const catalog = await server
                .knex(foldersTable)
                .select("slug_path")
                .orderBy("slug_path");
            expect(catalog.map((row: { slug_path: string }) => row.slug_path)).toEqual([
                "root/renamed",
                "root/renamed/child"
            ]);
        } finally {
            await server.close();
        }
    });
});
