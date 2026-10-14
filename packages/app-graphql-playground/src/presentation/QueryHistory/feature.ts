import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { QueryHistoryPresenter } from "./abstractions.js";
import { DefaultQueryHistoryPresenter } from "./QueryHistoryPresenter.js";

export const QueryHistoryFeature = createFeature({
    name: "QueryHistoryPresenter",
    register(container) {
        // One per container: the presenter reads the per-tenant query history repository.
        container.register(DefaultQueryHistoryPresenter).inContainerScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(QueryHistoryPresenter)
        };
    }
});
