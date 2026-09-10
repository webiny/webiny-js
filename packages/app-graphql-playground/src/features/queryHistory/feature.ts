import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { QueryHistoryRepository } from "./abstractions.js";
import { DefaultQueryHistoryRepository } from "./QueryHistoryRepository.js";

export const QueryHistoryRepositoryFeature = createFeature({
    name: "QueryHistoryRepository",
    register(container) {
        container.register(DefaultQueryHistoryRepository).inSingletonScope();
    },
    resolve(container) {
        return {
            repository: container.resolve(QueryHistoryRepository)
        };
    }
});
