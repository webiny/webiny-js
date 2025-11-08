import { createImplementation } from "@webiny/di";
import { GetProjectConfigService, IsTelemetryEnabled } from "~/abstractions/index.js";
import { telemetry as telemetryExtension } from "~/extensions/telemetry.js";

export class DefaultIsTelemetryEnabled implements IsTelemetryEnabled.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();

        const [telemetry] = projectConfig.extensionsByType<any>(telemetryExtension.definition.type);

        const telemetryDisabled = telemetry && telemetry.params.enabled === false;
        return !telemetryDisabled;
    }
}

export const isTelemetryEnabled = createImplementation({
    abstraction: IsTelemetryEnabled,
    implementation: DefaultIsTelemetryEnabled,
    dependencies: [GetProjectConfigService]
});
