import { BeforeDeploy, IsTelemetryEnabled } from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

class EnsureTelemetryEnabledForOssImpl implements BeforeDeploy.Interface {
    constructor(private isTelemetryEnabled: IsTelemetryEnabled.Interface) {}

    async execute() {
        const telemetryEnabled = await this.isTelemetryEnabled.execute();
        const wcpProjectId = process.env.WCP_PROJECT_ID;

        // If telemetry is disabled and WCP is not connected, throw an error
        if (!telemetryEnabled && !wcpProjectId) {
            const message = [
                `You are trying to disable telemetry in the open-source edition of Webiny, which is not possible.`,
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
    dependencies: [IsTelemetryEnabled]
});
