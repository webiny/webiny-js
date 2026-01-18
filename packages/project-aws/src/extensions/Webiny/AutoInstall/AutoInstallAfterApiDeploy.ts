import { ApiAfterDeploy } from "@webiny/project/abstractions/index.js";
import { UiService } from "@webiny/project/abstractions/services/UiService.js";
import { LoggerService } from "@webiny/project/abstractions/services/LoggerService.js";
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
    mutation InstallSystem($installationInput: JSON!) {
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

class AutoInstallAfterApiDeployImpl implements ApiAfterDeploy.Interface {
    constructor(
        private apiGqlClient: ApiGqlClient.Interface,
        private ui: UiService.Interface,
        private getProjectConfig: GetProjectConfigService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute(params: ApiAfterDeploy.Params): Promise<void> {
        if (params.preview) {
            // Skip auto-install on preview deployments
            return;
        }

        const projectConfig = await this.getProjectConfig.execute();
        const adminAutoInstallExtensions = projectConfig.extensionsByType("Project/AutoInstall");

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
            this.logger.error("Failed to check installation status", { error });
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
                    app: "Cognito",
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
            this.logger.error("Installation failed", { message, code });
            this.ui.error(`Installation failed: ${message} (${code})`);
            throw new Error(message);
        }

        this.ui.success("System installed successfully!");
        this.ui.info("Admin credentials:");
        this.ui.info(` Email: ${adminUser.email}`);
        this.ui.info(` Password: ${adminUser.password}`);
    }
}

export const AutoInstallAfterApiDeploy = ApiAfterDeploy.createImplementation({
    implementation: AutoInstallAfterApiDeployImpl,
    dependencies: [ApiGqlClient, UiService, GetProjectConfigService, LoggerService]
});
