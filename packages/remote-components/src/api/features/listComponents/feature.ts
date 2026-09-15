import { createFeature } from "@webiny/feature/api";
import { ListRemoteComponentsUseCase } from "./ListRemoteComponentsUseCase.js";
import { ListRemoteComponentsRepository } from "./ListRemoteComponentsRepository.js";

export const ListRemoteComponentsFeature = createFeature({
    name: "RemoteComponents/ListComponents",
    register(container) {
        container.register(ListRemoteComponentsUseCase);
        container.register(ListRemoteComponentsRepository).inSingletonScope();
    }
});
