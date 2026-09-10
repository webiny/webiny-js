import { createFeature } from "@webiny/feature/api";
import { DeleteRemoteComponentUseCase } from "./DeleteRemoteComponentUseCase.js";
import { DeleteRemoteComponentRepository } from "./DeleteRemoteComponentRepository.js";

export const DeleteRemoteComponentFeature = createFeature({
    name: "RemoteComponents/DeleteComponent",
    register(container) {
        container.register(DeleteRemoteComponentUseCase);
        container.register(DeleteRemoteComponentRepository).inSingletonScope();
    }
});
