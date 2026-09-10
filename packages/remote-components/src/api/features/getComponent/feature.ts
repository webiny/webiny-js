import { createFeature } from "@webiny/feature/api";
import { GetRemoteComponentUseCase } from "./GetRemoteComponentUseCase.js";
import { GetRemoteComponentRepository } from "./GetRemoteComponentRepository.js";

export const GetRemoteComponentFeature = createFeature({
    name: "RemoteComponents/GetComponent",
    register(container) {
        container.register(GetRemoteComponentUseCase);
        container.register(GetRemoteComponentRepository).inSingletonScope();
    }
});
