import { createFeature } from "@webiny/feature/api";
import { CreateRemoteComponentUseCase } from "./CreateRemoteComponentUseCase.js";
import { CreateRemoteComponentRepository } from "./CreateRemoteComponentRepository.js";

export const CreateRemoteComponentFeature = createFeature({
    name: "RemoteComponents/CreateComponent",
    register(container) {
        container.register(CreateRemoteComponentUseCase);
        container.register(CreateRemoteComponentRepository).inSingletonScope();
    }
});
