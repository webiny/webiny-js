import { expect } from "vitest";

export const INSTALL = /* GraphQL */ `
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

export const LOGIN = /* GraphQL */ `
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

/** The admin user the tests install the system with. */
export const admin = {
    firstName: "Test",
    lastName: "Admin",
    email: "test-admin@example.com",
    password: "test-admin-password"
};

interface GraphQLServer {
    graphql(
        query: string,
        variables?: Record<string, unknown>
    ): Promise<{ raw: string; body: any }>;
}

/** Installs the system with the test admin and logs in as them; returns the token. */
export const installAndLogIn = async (server: GraphQLServer): Promise<string> => {
    const install = await server.graphql(INSTALL, {
        installationInput: [{ app: "SelfHostedAuth", data: admin }]
    });
    expect(install.raw).not.toContain("No registration found");
    expect(install.body.data.system.installSystem).toEqual({ data: true, error: null });

    const login = await server.graphql(LOGIN, { email: admin.email, password: admin.password });
    expect(login.body.data.selfHostedAuthLogin.error).toBeNull();
    return login.body.data.selfHostedAuthLogin.data.token;
};
