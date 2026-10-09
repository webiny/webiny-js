import { createFeature } from "@webiny/feature/api";
import { ResolveLocatorUseCase } from "./ResolveLocatorUseCase.js";

export const ResolveLocatorFeature = createFeature({
    name: "Collaboration/ResolveLocator",
    register(container) {
        container.register(ResolveLocatorUseCase);
    }
});
