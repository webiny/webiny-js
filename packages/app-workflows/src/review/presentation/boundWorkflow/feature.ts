import { createFeature } from "@webiny/feature/admin";
import { BoundWorkflowPresenter as Abstraction } from "./abstractions.js";
import { BoundWorkflowPresenter } from "./BoundWorkflowPresenter.js";

export const BoundWorkflowFeature = createFeature({
    name: "Workflows/BoundWorkflow",
    register(container) {
        // Transient: `useFeature` memoizes one instance per component that asks.
        container.register(BoundWorkflowPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
