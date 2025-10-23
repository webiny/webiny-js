import { BaseError } from "@webiny/feature/api";

type InstallSystemErrorData = {
    reason: string;
};

export class InstallSystemError extends BaseError<InstallSystemErrorData> {
    override readonly code = "INSTALL_SYSTEM" as const;

    constructor(data: InstallSystemErrorData) {
        super({
            message: `System installation failed: ${data.reason}`,
            data
        });
    }
}

type SystemAlreadyInstalledErrorData = {
    message?: string;
};

export class SystemAlreadyInstalledError extends BaseError<SystemAlreadyInstalledErrorData> {
    override readonly code = "SYSTEM_ALREADY_INSTALLED" as const;

    constructor(data: SystemAlreadyInstalledErrorData = {}) {
        super({
            message: "System is already installed!",
            data
        });
    }
}
