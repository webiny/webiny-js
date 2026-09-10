import { createFeature } from "@webiny/feature/api";
import { GenerateRemoteComponentUseCase } from "./GenerateRemoteComponentUseCase.js";
import { GenerateRemoteComponentTask } from "./GenerateRemoteComponentTask.js";

export const GenerateRemoteComponentFeature = createFeature({
    name: "RemoteComponents/GenerateComponent",
    register(container) {
        container.register(GenerateRemoteComponentUseCase);
        container.register(GenerateRemoteComponentTask);
    }
});
