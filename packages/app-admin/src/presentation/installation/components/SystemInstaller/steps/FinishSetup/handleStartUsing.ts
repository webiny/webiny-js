import { getMachineId } from "@webiny/telemetry/react.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

const INSTALL_FINISH_URL =
    process.env.REACT_APP_WEBINY_INSTALL_FINISH_URL || "https://www.webiny.com/install/finish";

/**
 * If telemetry is enabled AND the admin is hosted on CloudFront (production
 * deployment), route the "Start using Webiny" CTA through the marketing
 * site's /install/finish page so the website's anonymous wts_did cookie can
 * be aliased to the deployer's machine_id. Falls through to the local
 * `finishInstallation` flow otherwise.
 */
const buildInstallFinishHref = (): string | null => {
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
    return `${INSTALL_FINISH_URL}?${params.toString()}`;
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
