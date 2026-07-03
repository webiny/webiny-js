import { createFeature } from "@webiny/feature/admin";
import { ListEntriesUseCase as UseCase } from "./abstractions.js";
import { ListEntriesUseCase } from "./ListEntriesUseCase.js";
import { ListEntriesRepository } from "./ListEntriesRepository.js";
import { ListEntriesGateway } from "./ListEntriesGateway.js";

export const ListEntriesFeature = createFeature({
    name: "CmsContentEntry/ListEntries",
    register(container) {
        container.register(ListEntriesUseCase);
        container.register(ListEntriesRepository).inSingletonScope();
        container.register(ListEntriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
