import { createFeature } from "@webiny/feature/api";
import { SettingsInstallerFeature } from "~/features/settings/feature.js";

export const FileManagerFeature = createFeature({
    name: "FileManager",
    register(container) {
        SettingsInstallerFeature.register(container);
    }
});
