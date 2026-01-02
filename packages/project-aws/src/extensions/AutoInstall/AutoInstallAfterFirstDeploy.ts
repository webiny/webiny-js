import { ApiAfterDeploy } from "@webiny/project/abstractions/index.js";
import { UiService } from "@webiny/project/abstractions/services/UiService.js";
import { GetProjectConfigService } from "@webiny/project/abstractions";
import { ApiGqlClient } from "~/abstractions/ApiGqlClient.js";

const IS_INSTALLED_QUERY = `
    query IsSystemInstalled {
        system {
            isSystemInstalled {
                data
                error {
                    message
                    code
                }
            }
        }
    }
`;

const INSTALL_MUTATION = `
    mutation InstallSystem($installationInput: [SystemInstallInput!]!) {
        system {
            installSystem(installationInput: $installationInput) {
                data
                error {
                    message
                    code
                }
            }
        }
    }
`;

interface IsInstalledResponse {
    system: {
        isSystemInstalled: {
            data: boolean;
            error?: {
                message: string;
                code: string;
            };
        };
    };
}

interface InstallResponse {
    system: {
        installSystem: {
            data: boolean;
            error?: {
                message: string;
                code: string;
            };
        };
    };
}

class AutoInstallAfterFirstDeployImpl implements ApiAfterDeploy.Interface {
    constructor(
        private apiGqlClient: ApiGqlClient.Interface,
        private ui: UiService.Interface,
        private getProjectConfig: GetProjectConfigService.Interface
    ) {}

    async execute(params: ApiAfterDeploy.Params) {
        const projectConfig = await this.getProjectConfig.execute();
        const adminAutoInstallExtensions = projectConfig.extensionsByType("Admin/AutoInstall");

        if (adminAutoInstallExtensions.length === 0) {
            return;
        }

        const config = adminAutoInstallExtensions[0].params;

        // Check if system is already installed
        this.ui.info("Checking if system is already installed...");

        try {
            const isInstalledResponse = await this.apiGqlClient.query<IsInstalledResponse>({
                query: IS_INSTALLED_QUERY
            });

            if (isInstalledResponse.data?.system.isSystemInstalled.data === true) {
                this.ui.info("System is already installed, skipping auto-install.");
                return;
            }
        } catch (error: any) {
            this.ui.warning(`Could not check installation status: ${error.message}`);
            return;
        }

        this.ui.info("Auto-installing...");

        const adminUser = config.adminUser || {
            firstName: "John",
            lastName: "Smith",
            email: "admin@webiny.com",
            password: "12345678"
        };

        const variables = {
            installationInput: [
                {
                    app: "AdminUser",
                    data: adminUser
                }
            ]
        };

        const installResponse = await this.apiGqlClient.mutation<InstallResponse>({
            mutation: INSTALL_MUTATION,
            variables
        });

        if (installResponse.data?.system.installSystem.error) {
            const { message, code } = installResponse.data.system.installSystem.error;
            this.ui.error(`Installation failed: ${message} (${code})`);
            throw new Error(message);
        }

        this.ui.success("System installed successfully!");
        this.ui.info("Admin credentials:");
        this.ui.info(` Email: ${adminUser.email}`);
        this.ui.info(` Password: ${adminUser.password}`);
    }
}

export const AutoInstallAfterFirstDeploy = ApiAfterDeploy.createImplementation({
    implementation: AutoInstallAfterFirstDeployImpl,
    dependencies: [ApiGqlClient, UiService, GetProjectConfigService]
});
