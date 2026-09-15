import { createFeature } from "@webiny/feature/api";
import { BundleRemoteComponentUseCase } from "./BundleRemoteComponentUseCase.js";

export const BundleRemoteComponentFeature = createFeature({
    name: "RemoteComponents/BundleComponent",
    register(container) {
        container.register(BundleRemoteComponentUseCase);
    }
});
