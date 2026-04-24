import { createFeature } from "@webiny/feature/api";
import { ApiKeyInstaller } from "./ApiKeyInstaller.js";

export const ApiKeyInstallerFeature = createFeature({
    name: "WebsiteBuilder/ApiKeyInstaller",
    register(container) {
        container.register(ApiKeyInstaller);
    }
});
