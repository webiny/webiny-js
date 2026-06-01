import { createFeature } from "@webiny/feature/admin";
import { PublishEntryUseCase as UseCase } from "./abstractions.js";
import { PublishEntryUseCase } from "./PublishEntryUseCase.js";
import { PublishEntryRepository } from "./PublishEntryRepository.js";
import { PublishEntryGateway } from "./PublishEntryGateway.js";

export const PublishEntryFeature = createFeature({
    name: "CmsContentEntry/PublishEntry",
    register(container) {
        container.register(PublishEntryUseCase);
        container.register(PublishEntryRepository).inSingletonScope();
        container.register(PublishEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
