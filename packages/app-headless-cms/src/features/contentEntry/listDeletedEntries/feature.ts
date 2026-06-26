import { createFeature } from "@webiny/feature/admin";
import { ListDeletedEntriesUseCase as UseCase } from "./abstractions.js";
import { ListDeletedEntriesUseCase } from "./ListDeletedEntriesUseCase.js";
import { ListDeletedEntriesRepository } from "./ListDeletedEntriesRepository.js";
import { ListDeletedEntriesGateway } from "./ListDeletedEntriesGateway.js";

export const ListDeletedEntriesFeature = createFeature({
    name: "CmsContentEntry/ListDeletedEntries",
    register(container) {
        container.register(ListDeletedEntriesUseCase);
        container.register(ListDeletedEntriesRepository).inSingletonScope();
        container.register(ListDeletedEntriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
