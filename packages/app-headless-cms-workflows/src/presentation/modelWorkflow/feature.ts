import { createFeature } from "@webiny/feature/admin";
import { CmsModelWorkflowPresenter as Abstraction } from "./abstractions.js";
import { CmsModelWorkflowPresenter } from "./CmsModelWorkflowPresenter.js";

export const CmsModelWorkflowFeature = createFeature({
    name: "Cms/Workflows/ModelWorkflow",
    register(container) {
        // Transient: `useFeature` memoizes one instance per component that asks.
        container.register(CmsModelWorkflowPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
