import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createHandler } from "./createHandler.js";

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
 * Installs the system through the full DDB+OS handler, the same way the admin app's installation
 * wizard does: on a fresh database the system reports itself as not installed, the install mutation
 * runs every app installer (security roles, file manager settings, CMS, website builder), and
 * afterwards the system is installed and refuses to install twice.
 *
 * No identity provider extension is registered (Cognito needs a real user pool), so the installation
 * input carries no admin user.
 */
describe("api-event-handler-aws-ddb-os — system installation", () => {
    it("installs the system on a fresh database", async () => {
        const graphql = createHandler(() => []);

        const before = await graphql(IS_INSTALLED);
        expect(before.statusCode).toBe(200);
        expect(before.body.data.system.isSystemInstalled).toEqual({ data: false, error: null });

        const install = await graphql(INSTALL, { installationInput: [] });
        expect(install.statusCode).toBe(200);
        expect(install.body.data.system.installSystem).toEqual({ data: true, error: null });

        const after = await graphql(IS_INSTALLED);
        expect(after.body.data.system.isSystemInstalled).toEqual({ data: true, error: null });

        const again = await graphql(INSTALL, { installationInput: [] });
        expect(again.body.data.system.installSystem.data).toBeNull();
        expect(again.body.data.system.installSystem.error.code).toBe("SYSTEM_ALREADY_INSTALLED");
    });
});
