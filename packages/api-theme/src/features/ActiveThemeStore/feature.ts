import { createFeature } from "@webiny/feature/api";
import { ActiveThemeStore } from "./ActiveThemeStore.js";

export const ActiveThemeStoreFeature = createFeature({
    name: "Theme/ActiveThemeStore",
    register(container) {
        container.register(ActiveThemeStore).inSingletonScope();
    }
});
