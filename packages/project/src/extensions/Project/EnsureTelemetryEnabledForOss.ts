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
                `You are trying to disable telemetry in the open-source edition of Webiny.`,
                `This feature is only available in the enterprise edition.`,
                `Please remove %s from your %s file or connect your project to Webiny Control Panel (WCP).`
            ].join(" ");

            const error = new Error(message);

            throw GracefulError.from(
                error,
                message,
                "<Project.Telemetry enabled={false} />",
                "webiny.config.tsx"
            );
        }
    }
}

export const EnsureTelemetryEnabledForOss = BeforeDeploy.createImplementation({
    implementation: EnsureTelemetryEnabledForOssImpl,
    dependencies: [IsTelemetryEnabled]
});
