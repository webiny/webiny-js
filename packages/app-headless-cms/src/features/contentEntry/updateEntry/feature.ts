import { createFeature } from "@webiny/feature/admin";
import { UpdateEntryUseCase as UseCase } from "./abstractions.js";
import { UpdateEntryUseCase } from "./UpdateEntryUseCase.js";
import { UpdateEntryRepository } from "./UpdateEntryRepository.js";
import { UpdateEntryGateway } from "./UpdateEntryGateway.js";

export const UpdateEntryFeature = createFeature({
    name: "CmsContentEntry/UpdateEntry",
    register(container) {
        container.register(UpdateEntryUseCase);
        container.register(UpdateEntryRepository).inSingletonScope();
        container.register(UpdateEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
