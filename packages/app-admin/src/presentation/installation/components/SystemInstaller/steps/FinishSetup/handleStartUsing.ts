import { getMachineId } from "@webiny/telemetry/react.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

const DEFAULT_INSTALL_FINISH_URL = "https://www.webiny.com/install/finish";

const buildInstallFinishHref = (): string | null => {
    const installFinishUrl =
        process.env.REACT_APP_WEBINY_INSTALL_FINISH_URL || DEFAULT_INSTALL_FINISH_URL;

    if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
        return null;
    }

    if (typeof window === "undefined") {
        return null;
    }
    const isCloudFrontHost = window.location.hostname.endsWith(".cloudfront.net");
    const allowAlternate = Boolean(process.env.REACT_APP_WEBINY_INSTALL_FINISH_URL);
    if (!isCloudFrontHost && !allowAlternate) {
        return null;
    }

    const machineId = getMachineId();
    if (!machineId) {
        return null;
    }

    const currentUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        machine_id: machineId,
        return_to: currentUrl
    });
    return `${installFinishUrl}?${params.toString()}`;
};

export const handleStartUsing = (
    finishInstallation: ISystemInstallerPresenter["finishInstallation"]
) => {
    if (typeof window !== "undefined") {
        const handoff = buildInstallFinishHref();
        if (handoff) {
            window.location.assign(handoff);
            return;
        }
    }
    finishInstallation();
};
