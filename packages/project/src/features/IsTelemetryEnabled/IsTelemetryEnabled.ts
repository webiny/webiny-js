import { createImplementation } from "@webiny/di";
import { GetProjectConfigService, IsTelemetryEnabled } from "~/abstractions/index.js";
import { Telemetry as TelemetryExtension } from "~/extensions/Telemetry.js";
import { isEnabled as telemetryEnabledViaGlobalCfg } from "@webiny/telemetry/cli.js";

export class DefaultIsTelemetryEnabled implements IsTelemetryEnabled.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();
        const [telemetry] = projectConfig.extensionsByType(TelemetryExtension);
        const telemetryDisabledViaExtension = telemetry && telemetry.params.enabled === false;

        if (telemetryDisabledViaExtension) {
            return false;
        }

        return telemetryEnabledViaGlobalCfg();
    }
}

export const isTelemetryEnabled = createImplementation({
    abstraction: IsTelemetryEnabled,
    implementation: DefaultIsTelemetryEnabled,
    dependencies: [GetProjectConfigService]
});
