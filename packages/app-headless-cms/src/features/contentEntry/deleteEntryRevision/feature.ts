import { createFeature } from "@webiny/feature/admin";
import { DeleteEntryRevisionUseCase as UseCase } from "./abstractions.js";
import { DeleteEntryRevisionUseCase } from "./DeleteEntryRevisionUseCase.js";
import { DeleteEntryRevisionRepository } from "./DeleteEntryRevisionRepository.js";
import { DeleteEntryRevisionGateway } from "./DeleteEntryRevisionGateway.js";

export const DeleteEntryRevisionFeature = createFeature({
    name: "CmsContentEntry/DeleteEntryRevision",
    register(container) {
        container.register(DeleteEntryRevisionUseCase);
        container.register(DeleteEntryRevisionRepository).inSingletonScope();
        container.register(DeleteEntryRevisionGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
