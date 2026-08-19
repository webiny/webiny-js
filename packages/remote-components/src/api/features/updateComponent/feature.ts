import { createFeature } from "@webiny/feature/api";
import { UpdateRemoteComponentUseCase } from "./UpdateRemoteComponentUseCase.js";
import { UpdateRemoteComponentRepository } from "./UpdateRemoteComponentRepository.js";

export const UpdateRemoteComponentFeature = createFeature({
    name: "RemoteComponents/UpdateComponent",
    register(container) {
        container.register(UpdateRemoteComponentUseCase);
        container.register(UpdateRemoteComponentRepository).inSingletonScope();
    }
});
