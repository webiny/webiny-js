import {
    BeforeDeploy,
    GetProductionEnvironments,
    GetProjectConfig,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

class ValidateEncryptionBeforeDeployImpl implements BeforeDeploy.Interface {
    constructor(
        private getProductionEnvironments: GetProductionEnvironments.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private getProjectConfig: GetProjectConfig.Interface
    ) {}

    async execute() {
        const { env } = this.projectSdkParamsService.get();
        const prodEnvs = await this.getProductionEnvironments.execute();

        if (!prodEnvs.includes(env)) {
            return;
        }

        const projectConfig = await this.getProjectConfig.execute();
        const [encryption] = projectConfig.extensionsByType("Infra/Encryption");

        if (encryption) {
            return;
        }

        const error = new Error("Encryption is not configured for production environment.");

        const message = [
            "Deploying to a production environment requires encryption to be configured.",
            "Set the %s environment variable and add %s to your project config.",
            "Learn more: https://webiny.link/encryption"
        ].join(" ");

        throw GracefulError.from(
            error,
            message,
            "WEBINY_ENCRYPTION_PASSPHRASE",
            "<Infra.Encryption>"
        );
    }
}

export const ValidateEncryptionBeforeDeploy = BeforeDeploy.createImplementation({
    implementation: ValidateEncryptionBeforeDeployImpl,
    dependencies: [GetProductionEnvironments, ProjectSdkParamsService, GetProjectConfig]
});
