import { createFeature } from "@webiny/feature/admin";
import { RestoreFromTrashUseCase as UseCase } from "./abstractions.js";
import { RestoreFromTrashUseCase } from "./RestoreFromTrashUseCase.js";
import { RestoreFromTrashRepository } from "./RestoreFromTrashRepository.js";
import { RestoreFromTrashGateway } from "./RestoreFromTrashGateway.js";

export const RestoreFromTrashFeature = createFeature({
    name: "CmsContentEntry/RestoreFromTrash",
    register(container) {
        container.register(RestoreFromTrashUseCase);
        container.register(RestoreFromTrashRepository).inSingletonScope();
        container.register(RestoreFromTrashGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
