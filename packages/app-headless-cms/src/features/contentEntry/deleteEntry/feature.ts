import { createFeature } from "@webiny/feature/admin";
import { DeleteEntryUseCase as UseCase } from "./abstractions.js";
import { DeleteEntryUseCase } from "./DeleteEntryUseCase.js";
import { DeleteEntryRepository } from "./DeleteEntryRepository.js";
import { DeleteEntryGateway } from "./DeleteEntryGateway.js";

export const DeleteEntryFeature = createFeature({
    name: "CmsContentEntry/DeleteEntry",
    register(container) {
        container.register(DeleteEntryUseCase);
        container.register(DeleteEntryRepository).inSingletonScope();
        container.register(DeleteEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
