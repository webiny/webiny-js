import { createFeature } from "@webiny/feature/api";
import CmsInstaller from "./CmsInstaller.js";

export const CmsInstallerFeature = createFeature({
    name: "CmsInstallerFeature",
    register(container) {
        container.register(CmsInstaller);
    }
});
