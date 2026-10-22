import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { QueryHistoryRepository } from "./abstractions.js";
import { DefaultQueryHistoryRepository } from "./QueryHistoryRepository.js";

export const QueryHistoryRepositoryFeature = createFeature({
    name: "QueryHistoryRepository",
    register(container) {
        // One per container, so query history is stored per tenant. See PlaygroundRepositoryFeature.
        container.register(DefaultQueryHistoryRepository).inContainerScope();
    },
    resolve(container) {
        return {
            repository: container.resolve(QueryHistoryRepository)
        };
    }
});
