import { createFeature } from "@webiny/feature/api";
import { FileUrlGenerator } from "./FileUrlGenerator.js";
import { SettingsFileUrlPrefixProvider } from "./SettingsFileUrlPrefixProvider.js";

export const FileUrlGeneratorFeature = createFeature({
    name: "FileManager/FileUrlGenerator",
    register(container) {
        container.register(FileUrlGenerator).inSingletonScope();
        // A singleton, so the settings are read once per request however many URLs are generated.
        container.register(SettingsFileUrlPrefixProvider).inSingletonScope();
    }
});
