import { buildInstallFinishHref } from "./buildInstallFinishHref.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

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
