import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { QueryHistoryPresenter } from "./abstractions.js";
import { DefaultQueryHistoryPresenter } from "./QueryHistoryPresenter.js";

export const QueryHistoryFeature = createFeature({
    name: "QueryHistoryPresenter",
    register(container) {
        container.register(DefaultQueryHistoryPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(QueryHistoryPresenter)
        };
    }
});
