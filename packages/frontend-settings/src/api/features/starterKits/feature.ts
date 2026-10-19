import { createFeature } from "@webiny/feature/api";
import { DefaultStarterKitsProvider } from "./DefaultStarterKitsProvider.js";

export const FrontendStarterKitsFeature = createFeature({
    name: "FrontendSettings/StarterKits",
    register(container) {
        container.register(DefaultStarterKitsProvider);
    }
});
