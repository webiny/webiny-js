import { createFeature } from "@webiny/feature/api";
import { SettingsInstaller } from "~/features/settings/SettingsInstaller.js";

export const SettingsInstallerFeature = createFeature({
    name: "FileManager/SettingsInstaller",
    register(container) {
        container.register(SettingsInstaller);
    }
});
