import { createFeature } from "@webiny/feature/admin";
import { UnpublishEntryUseCase as UseCase } from "./abstractions.js";
import { UnpublishEntryUseCase } from "./UnpublishEntryUseCase.js";
import { UnpublishEntryRepository } from "./UnpublishEntryRepository.js";
import { UnpublishEntryGateway } from "./UnpublishEntryGateway.js";

export const UnpublishEntryFeature = createFeature({
    name: "CmsContentEntry/UnpublishEntry",
    register(container) {
        container.register(UnpublishEntryUseCase);
        container.register(UnpublishEntryRepository).inSingletonScope();
        container.register(UnpublishEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
