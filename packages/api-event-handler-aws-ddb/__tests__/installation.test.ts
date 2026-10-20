import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createAwsDdbApiHandler } from "~/createWebinyApiHandler.js";

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

/**
 * Installs the system through the full DDB handler, the same way the admin app's installation wizard
 * does: on a fresh database the system reports itself as not installed, the install mutation runs every
 * app installer (security roles, file manager settings, CMS, website builder), and afterwards the
 * system is installed and refuses to install twice.
 *
 * No identity provider extension is registered (Cognito needs a real user pool), so the installation
 * input carries no admin user.
 */
describe("api-event-handler-aws-ddb — system installation", () => {
    it("installs the system on a fresh database", async () => {
        const documentClient = getDocumentClient();
        const handler = createAwsDdbApiHandler({ extensions: () => [], documentClient });

        let requestId = 0;
        const graphql = async (query: string, variables: Record<string, unknown> = {}) => {
            requestId++;
            const body = JSON.stringify({ query, variables });
            const result = await handler({
                httpMethod: "POST",
                path: "/graphql",
                headers: {
                    "content-type": "application/json",
                    "x-tenant": "root"
                },
                requestContext: { requestId: `test-req-install-${requestId}` },
                body,
                isBase64Encoded: false
            });
            expect(result.statusCode).toBe(200);
            const responseBody = String(result.body);
            return JSON.parse(responseBody);
        };

        const before = await graphql(IS_INSTALLED);
        expect(before.data.system.isSystemInstalled).toEqual({ data: false, error: null });

        const install = await graphql(INSTALL, { installationInput: [] });
        expect(install.data.system.installSystem).toEqual({ data: true, error: null });

        const after = await graphql(IS_INSTALLED);
        expect(after.data.system.isSystemInstalled).toEqual({ data: true, error: null });

        const again = await graphql(INSTALL, { installationInput: [] });
        expect(again.data.system.installSystem.data).toBeNull();
        expect(again.data.system.installSystem.error.code).toBe("SYSTEM_ALREADY_INSTALLED");
    });
});
