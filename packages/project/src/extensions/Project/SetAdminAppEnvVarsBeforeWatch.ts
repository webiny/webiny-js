import {
    AdminBeforeWatch,
    IsTelemetryEnabled,
    GetProjectIdService,
    GetProjectInstallationIdService,
    GetProjectVersionService
} from "~/abstractions/index.js";
import { globalConfig } from "@webiny/global-config";
import { isCI } from "ci-info";

class SetAdminAppEnvVarsBeforeWatchImpl implements AdminBeforeWatch.Interface {
    constructor(
        private isTelemetryEnabled: IsTelemetryEnabled.Interface,
        private getProjectIdService: GetProjectIdService.Interface,
        private getProjectInstallationIdService: GetProjectInstallationIdService.Interface,
        private getProjectVersionService: GetProjectVersionService.Interface
    ) {}

    async execute() {
        const projectId = await this.getProjectIdService.execute();
        const projectVersion = this.getProjectVersionService.execute();

        const telemetry = await this.isTelemetryEnabled.execute();

        if (projectId) {
            process.env.REACT_APP_WEBINY_PROJECT_ID = projectId;
            process.env.REACT_APP_WCP_PROJECT_ID = projectId;
        }

        if (!("REACT_APP_WEBINY_INSTALLATION_ID" in process.env)) {
            const installationId = this.getProjectInstallationIdService.execute();
            if (installationId) {
                process.env.REACT_APP_WEBINY_INSTALLATION_ID = installationId;
            }
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

export const SetAdminAppEnvVarsBeforeWatch = AdminBeforeWatch.createImplementation({
    implementation: SetAdminAppEnvVarsBeforeWatchImpl,
    dependencies: [
        IsTelemetryEnabled,
        GetProjectIdService,
        GetProjectInstallationIdService,
        GetProjectVersionService
    ]
});
