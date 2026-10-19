import { createFeature } from "@webiny/feature/admin";
import { DuplicateEntryUseCase as UseCase } from "./abstractions.js";
import { DuplicateEntryUseCase } from "./DuplicateEntryUseCase.js";
import { DuplicateEntryRepository } from "./DuplicateEntryRepository.js";
import { DuplicateEntryGateway } from "./DuplicateEntryGateway.js";

export const DuplicateEntryFeature = createFeature({
    name: "CmsContentEntry/DuplicateEntry",
    register(container) {
        container.register(DuplicateEntryUseCase);
        container.register(DuplicateEntryRepository).inSingletonScope();
        container.register(DuplicateEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
