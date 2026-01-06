import {
    BeforeDeploy,
    IsTelemetryEnabled,
    IsWcpEnabled,
    IsWebinyJsRepo
} from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

class EnsureTelemetryEnabledForOssImpl implements BeforeDeploy.Interface {
    constructor(
        private isTelemetryEnabled: IsTelemetryEnabled.Interface,
        private isWcpEnabled: IsWcpEnabled.Interface,
        private isWebinyJsRepo: IsWebinyJsRepo.Interface
    ) {}

    async execute() {
        // Don't enforce telemetry validation in the webiny-js development repository
        const isDevRepo = this.isWebinyJsRepo.execute();
        if (isDevRepo) {
            return;
        }

        const telemetryEnabled = await this.isTelemetryEnabled.execute();
        const wcpEnabled = await this.isWcpEnabled.execute();

        // If telemetry is disabled and WCP is not connected, throw an error
        if (!telemetryEnabled && !wcpEnabled) {
            const message = [
                `You are trying to deploy your project, but telemetry is currently disabled.`,
                `The open-source edition of Webiny requires telemetry to be enabled.`,
                `Please re-enable telemetry to proceed with the deployment, or connect your project to Webiny Control Panel (WCP).`,
                `Learn more: https://webiny.link/telemetry-oss`
            ].join(" ");

            const error = new Error("Cannot deploy with telemetry disabled in OSS edition.");

            throw GracefulError.from(error, message);
        }
    }
}

export const EnsureTelemetryEnabledForOss = BeforeDeploy.createImplementation({
    implementation: EnsureTelemetryEnabledForOssImpl,
    dependencies: [IsTelemetryEnabled, IsWcpEnabled, IsWebinyJsRepo]
});
