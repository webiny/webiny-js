import {
    AdminBeforeBuild,
    GetProjectIdService,
    GetProjectVersionService,
    IsTelemetryEnabled
} from "~/abstractions/index.js";
import { isEnabled as telemetryEnabledViaGlobalCfg } from "@webiny/telemetry/cli.js";
import { globalConfig } from "@webiny/global-config";
import { isCI } from "ci-info";

class SetAdminAppEnvVarsBeforeBuildImpl implements AdminBeforeBuild.Interface {
    constructor(
        private isTelemetryEnabled: IsTelemetryEnabled.Interface,
        private getProjectIdService: GetProjectIdService.Interface,
        private getProjectVersionService: GetProjectVersionService.Interface
    ) {}

    async execute() {
        const projectId = await this.getProjectIdService.execute();
        const projectVersion = this.getProjectVersionService.execute();

        const telemetryDisabledViaGlobalConfig = !telemetryEnabledViaGlobalCfg();
        const telemetryDisabledViaExtension = await this.isTelemetryEnabled
            .execute()
            .then(enabled => !enabled);

        let telemetry = true;
        if (telemetryDisabledViaExtension) {
            telemetry = false;
        } else if (telemetryDisabledViaGlobalConfig) {
            telemetry = false;
        }

        if (projectId) {
            process.env.REACT_APP_WCP_PROJECT_ID = projectId;
        }

        if (!("REACT_APP_WEBINY_TELEMETRY" in process.env)) {
            process.env.REACT_APP_WEBINY_TELEMETRY = String(telemetry);
        }

        if (!("REACT_APP_WEBINY_TELEMETRY_USER_ID" in process.env)) {
            process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID = globalConfig.get("id");
        }

        if (!("REACT_APP_WEBINY_TELEMETRY_NEW_USER" in process.env)) {
            const newUser = Boolean(globalConfig.get("newUser")).toString();
            process.env.REACT_APP_WEBINY_TELEMETRY_NEW_USER = newUser;
        }

        if (!("INLINE_RUNTIME_CHUNK" in process.env)) {
            process.env.INLINE_RUNTIME_CHUNK = "true";
        }

        if (!("REACT_APP_IS_CI" in process.env)) {
            process.env.REACT_APP_IS_CI = Boolean(isCI).toString();
        }

        if (!("REACT_APP_WEBINY_VERSION" in process.env)) {
            process.env.REACT_APP_WEBINY_VERSION = projectVersion;
        }
    }
}

export const SetAdminAppEnvVarsBeforeBuild = AdminBeforeBuild.createImplementation({
    implementation: SetAdminAppEnvVarsBeforeBuildImpl,
    dependencies: [IsTelemetryEnabled, GetProjectIdService, GetProjectVersionService]
});
