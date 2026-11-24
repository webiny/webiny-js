import { createFeature } from "@webiny/feature/admin";
import { ThemeSelection } from "./abstractions.js";
import { ThemeVariablesWriter } from "./abstractions.js";
import { LocalStorageThemeSelection } from "./LocalStorageThemeSelection.js";
import { DocumentThemeVariablesWriter } from "./DocumentThemeVariablesWriter.js";

/*
 * Registered in the root container. Singletons are built from the container that registers them,
 * so `LocalStorageThemeSelection` gets the root local storage even when it is resolved through a
 * tenant's child container.
 */
export const ThemeFeature = createFeature({
    name: "Theme",
    register(container) {
        container.register(LocalStorageThemeSelection).inSingletonScope();
        container.register(DocumentThemeVariablesWriter).inSingletonScope();
    },
    resolve(container) {
        return {
            selection: container.resolve(ThemeSelection),
            writer: container.resolve(ThemeVariablesWriter)
        };
    }
});
