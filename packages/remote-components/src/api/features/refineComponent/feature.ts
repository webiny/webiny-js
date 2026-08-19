import { createFeature } from "@webiny/feature/api";
import { RefineRemoteComponentUseCase } from "./RefineRemoteComponentUseCase.js";
import { RefineRemoteComponentTask } from "./RefineRemoteComponentTask.js";

export const RefineRemoteComponentFeature = createFeature({
    name: "RemoteComponents/RefineComponent",
    register(container) {
        container.register(RefineRemoteComponentUseCase);
        container.register(RefineRemoteComponentTask);
    }
});
