import { createFeature } from "@webiny/feature/api";
import { InstallSystemFeature } from "./InstallSystem/feature.js";

export const SystemFeature = createFeature({
    name: "SystemFeature",
    register(container) {
        InstallSystemFeature.register(container);
    }
});
