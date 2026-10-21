import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
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
            }
        }
    }
`;

const CREATE_USER = /* GraphQL */ `
    mutation CreateUser($data: AdminUsersCreateInput!) {
        adminUsers {
            createUser(data: $data) {
                data {
                    id
                    email
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const UPDATE_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: AdminUsersUpdateInput!) {
        adminUsers {
            updateUser(id: $id, data: $data) {
                data {
                    email
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const UPDATE_CURRENT_USER = /* GraphQL */ `
    mutation UpdateCurrentUser($data: AdminUsersCurrentUserInput!) {
        adminUsers {
            updateCurrentUser(data: $data) {
                data {
                    firstName
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const DELETE_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        adminUsers {
            deleteUser(id: $id) {
                data
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

const editor = {
    firstName: "Ed",
    lastName: "Itor",
    email: "editor@example.com",
    password: "editor-password"
};

/**
 * The admin user mutations through the full standalone SQL server: an administrator adds a user,
 * the user signs in, changes their own details, gets a new password from the administrator, and
 * is deleted, after which the password stops working.
 */
describe("api-event-handler-standalone-sql — admin users", () => {
    it("manages users that can sign in", async () => {
        const server = await createServer();

        const login = async (email: string, password: string) => {
            const response = await server.graphql(LOGIN, { email, password });
            return response.body.data.selfHostedAuthLogin;
        };

        try {
            const installationInput = [{ app: "SelfHostedAuth", data: admin }];
            const install = await server.graphql(INSTALL, { installationInput });
            expect(install.body.data.system.installSystem).toEqual({ data: true, error: null });

            const adminToken = (await login(admin.email, admin.password)).data.token;

            const created = await server.graphql(CREATE_USER, { data: editor }, adminToken);
            expect(created.body.data.adminUsers.createUser.error).toBeNull();
            const editorId = created.body.data.adminUsers.createUser.data.id;

            const editorLogin = await login(editor.email, editor.password);
            expect(editorLogin.error).toBeNull();
            const editorToken = editorLogin.data.token;

            const duplicate = await server.graphql(CREATE_USER, { data: editor }, adminToken);
            expect(duplicate.body.data.adminUsers.createUser.error.code).toBe("ACCOUNT_EXISTS");

            // Signed in as themselves, with no `adminUsers` permission of their own.
            const renamed = await server.graphql(
                UPDATE_CURRENT_USER,
                { data: { firstName: "Edward" } },
                editorToken
            );
            expect(renamed.body.data.adminUsers.updateCurrentUser).toEqual({
                data: { firstName: "Edward" },
                error: null
            });

            const notAllowed = await server.graphql(CREATE_USER, {
                data: { ...editor, email: "someone@example.com" }
            });
            expect(notAllowed.body.data.adminUsers.createUser.data).toBeNull();

            /*
             * api-core does not apply email changes, so the address stays put and the credential
             * has to stay with it. The new password takes effect.
             */
            const updated = await server.graphql(
                UPDATE_USER,
                {
                    id: editorId,
                    data: { email: "ed@example.com", password: "another-password" }
                },
                adminToken
            );
            expect(updated.body.data.adminUsers.updateUser).toEqual({
                data: { email: editor.email },
                error: null
            });

            expect((await login(editor.email, editor.password)).error.code).toBe(
                "INVALID_CREDENTIALS"
            );
            expect((await login("ed@example.com", "another-password")).error.code).toBe(
                "INVALID_CREDENTIALS"
            );
            expect((await login(editor.email, "another-password")).error).toBeNull();

            const deleted = await server.graphql(DELETE_USER, { id: editorId }, adminToken);
            expect(deleted.body.data.adminUsers.deleteUser).toEqual({ data: true, error: null });

            expect((await login(editor.email, "another-password")).error.code).toBe(
                "INVALID_CREDENTIALS"
            );
        } finally {
            await server.close();
        }
    });
});
