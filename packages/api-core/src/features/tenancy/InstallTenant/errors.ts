import { BaseError } from "@webiny/feature/api";

type InstallTenantErrorData = {
    reason: string;
    failedApp: string;
    installedApps: string[];
    cause?: Error;
};

export class InstallTenantError extends BaseError<InstallTenantErrorData> {
    override readonly code = "INSTALL_TENANT" as const;

    constructor(data: InstallTenantErrorData) {
        super({
            message: `Installation failed for app "${data.failedApp}": ${data.reason}`,
            data
        });
    }
}

type InstallationDependencyErrorData = {
    reason: string;
};

export class InstallationDependencyError extends BaseError<InstallationDependencyErrorData> {
    override readonly code = "INSTALLATION_DEPENDENCY" as const;

    constructor(data: InstallationDependencyErrorData) {
        super({
            message: `Installation dependency error: ${data.reason}`,
            data
        });
    }
}
