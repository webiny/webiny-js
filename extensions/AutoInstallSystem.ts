import { ApiAfterDeploy } from "webiny/infra/features/ApiAfterDeploy";
import { UiService } from "webiny/infra/features/UiService";
import { ApiGqlClient } from "webiny/infra/features/ApiGqlClient";

const IS_INSTALLED_QUERY = `
    query IsSystemInstalled {
        system {
            isSystemInstalled {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const INSTALL_MUTATION = `
    mutation InstallSystem($installationInput: JSON!) {
        system {
            installSystem(installationInput: $installationInput) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

class AutoInstallSystemAfterFirstDeploy implements ApiAfterDeploy.Interface {
    constructor(
        private apiGqlClient: ApiGqlClient.Interface,
        private ui: UiService.Interface
    ) {}

    async execute(params: ApiAfterDeploy.Params) {
        const autoInstallEnabled = process.env.WEBINY_AUTO_INSTALL === "true";
        if (!autoInstallEnabled) {
            return;
        }

        // Check if system is already installed
        this.ui.info("Checking if system is already installed...");

        const context = {
            app: params.app,
            env: params.env,
            variant: params.variant
        };

        try {
            const isInstalledResponse = await this.apiGqlClient.query({
                query: IS_INSTALLED_QUERY,
                context
            });

            console.log('isInstalledResponse', isInstalledResponse)
            if (isInstalledResponse.data?.system?.isSystemInstalled?.data === true) {
                this.ui.info("System is already installed, skipping auto-install.");
                return;
            }
        } catch (error: any) {
            this.ui.warning(`Could not check installation status: ${error.message}`);
        }

        this.ui.info("Auto-installing...");

        const variables = {
            installationInput: ([
                {
                    app: "AdminUser",
                    data: {
                        firstName: "John",
                        lastName: "Smith",
                        email: "admin@webiny.com",
                        password: "12345678"
                    }
                }
            ])
        };

        const installResponse = await this.apiGqlClient.mutation({
            mutation: INSTALL_MUTATION,
            variables,
            context
        });

        if (installResponse.data?.system?.installSystem?.error) {
            const { message, code } = installResponse.data.system.installSystem.error;
            this.ui.error(`Installation failed: ${message} (${code})`);
            throw new Error(message);
        }

        this.ui.success("System installed successfully!");
        this.ui.info("Admin credentials:");
        this.ui.info("  Email: admin@webiny.com");
        this.ui.info("  Password: 12345678");
    }
}

export const AutoInstallSystem = ApiAfterDeploy.createImplementation({
    implementation: AutoInstallSystemAfterFirstDeploy,
    dependencies: [ApiGqlClient, UiService]
});
