import { createFeature } from "@webiny/feature/api";
import { GenerateRemoteComponentUseCase } from "./GenerateRemoteComponentUseCase.js";
import { GenerateRemoteComponentTask } from "./GenerateRemoteComponentTask.js";
import { RemoteComponentGenerationCapabilityImplementation } from "~/api/features/shared/capability.js";

export const GenerateRemoteComponentFeature = createFeature({
    name: "RemoteComponents/GenerateComponent",
    register(container) {
        container.register(GenerateRemoteComponentUseCase);
        container.register(GenerateRemoteComponentTask);
        // Registered here rather than beside refinement so the capability exists exactly once; the
        // two share it, and generation is the feature that is always present when refinement is.
        container.register(RemoteComponentGenerationCapabilityImplementation);
    }
});
