import { createFeature } from "@webiny/feature/api";
import { SettingsInstaller } from "./SettingsInstaller.js";

export const SettingsInstallerFeature = createFeature({
    name: "FileManager/SettingsInstaller",
    register(container) {
        container.register(SettingsInstaller);
    }
});
