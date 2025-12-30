import { ApiAfterDeploy } from "webiny/infra/features/ApiAfterDeploy";
import { UiService } from "webiny/infra/features/UiService";
import { ApiGqlClient } from "webiny/infra/features/ApiGqlClient";

import {
    IS_INSTALLED_QUERY,
    INSTALL_MUTATION,
    type IsInstalledResponse,
    type InstallResponse
} from "./graphql";

class AutoInstallAfterFirstDeploy implements ApiAfterDeploy.Interface {
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

        const variables = {
            installationInput: [
                {
                    app: "AdminUser",
                    data: {
                        firstName: "John",
                        lastName: "Smith",
                        email: "admin@webiny.com",
                        password: "12345678"
                    }
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
        this.ui.info(" Email: admin@webiny.com");
        this.ui.info(" Password: 12345678");
    }
}

export const AutoInstall = ApiAfterDeploy.createImplementation({
    implementation: AutoInstallAfterFirstDeploy,
    dependencies: [ApiGqlClient, UiService]
});
