import { getMachineId } from "@webiny/telemetry/react.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

const INSTALL_FINISH_URL =
    process.env.REACT_APP_WEBINY_INSTALL_FINISH_URL || "https://www.webiny.com/install/finish";

/**
 * If telemetry is enabled, route the "Start using Webiny" CTA through the
 * marketing site's /install/finish page so the website's anonymous wts_did
 * cookie can be aliased to the deployer's machine_id. Falls through to the
 * local `finishInstallation` flow otherwise.
 *
 * This used to run only when the admin was served from a `.cloudfront.net`
 * host, which meant self-hosted installs were never aliased and the whole
 * install-to-marketing-visit link was AWS-only. The website side of the
 * handoff drops its matching CloudFront restriction, so both halves of the
 * path now work for any host.
 */
const buildInstallFinishHref = (): string | null => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
        return null;
    }

    if (typeof window === "undefined") {
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
