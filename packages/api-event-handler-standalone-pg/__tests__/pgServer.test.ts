import { describe, expect, it } from "vitest";
import { createServer } from "./createServer.js";

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

/**
 * The full standalone server on the Postgres-native storage, as `<Infra.Pglite>` and
 * `<Infra.Postgres>` (the default storage) build it: install, log in, and folders kept in the
 * folder catalog, with a parent's rename reaching its descendants' paths at once.
 */
describe("api-event-handler-standalone-pg — full server", () => {
    it("installs, and stores content in the Postgres-native tables", async () => {
        const server = await createServer();

        try {
            const install = await server.graphql(INSTALL, {
                installationInput: [{ app: "SelfHostedAuth", data: admin }]
            });
            expect(install.raw).not.toContain("No registration found");
            expect(install.body.data.system.installSystem).toEqual({ data: true, error: null });

            const login = await server.graphql(LOGIN, {
                email: admin.email,
                password: admin.password
            });
            expect(login.body.data.selfHostedAuthLogin.error).toBeNull();
            const token = login.body.data.selfHostedAuthLogin.data.token;

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
