import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createServer } from "./createServer.js";

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

const GET_CURRENT_USER = /* GraphQL */ `
    query GetCurrentUser {
        adminUsers {
            getCurrentUser {
                data {
                    email
                    firstName
                    lastName
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

/**
 * Installs the system through the full standalone SQL server, the same way the admin app's
 * installation wizard does: on a fresh database the system reports itself as not installed, the
 * install mutation runs every app installer (security roles, file manager settings, CMS, website
 * builder, and the self-hosted auth admin user), and afterwards the system is installed, refuses to
 * install twice, and the admin user can log in.
 */
describe("api-event-handler-standalone-sql — system installation", () => {
    it("installs the system on a fresh database and lets the admin user log in", async () => {
        const server = await createServer();

        try {
            const before = await server.graphql(IS_INSTALLED);
            expect(before.statusCode).toBe(200);
            expect(before.body.data.system.isSystemInstalled).toEqual({
                data: false,
                error: null
            });

            const installationInput = [{ app: "SelfHostedAuth", data: admin }];
            const install = await server.graphql(INSTALL, { installationInput });
            expect(install.statusCode).toBe(200);
            expect(install.body.data.system.installSystem).toEqual({ data: true, error: null });

            const after = await server.graphql(IS_INSTALLED);
            expect(after.body.data.system.isSystemInstalled).toEqual({ data: true, error: null });

            const again = await server.graphql(INSTALL, { installationInput });
            expect(again.body.data.system.installSystem.data).toBeNull();
            expect(again.body.data.system.installSystem.error.code).toBe(
                "SYSTEM_ALREADY_INSTALLED"
            );

            const login = await server.graphql(LOGIN, {
                email: admin.email,
                password: admin.password
            });
            expect(login.body.data.selfHostedAuthLogin.error).toBeNull();
            const token = login.body.data.selfHostedAuthLogin.data.token;
            expect(typeof token).toBe("string");

            const currentUser = await server.graphql(GET_CURRENT_USER, {}, token);
            expect(currentUser.body.data.adminUsers.getCurrentUser).toEqual({
                data: {
                    email: admin.email,
                    firstName: admin.firstName,
                    lastName: admin.lastName
                },
                error: null
            });
        } finally {
            await server.close();
        }
    });
});
