import { createFeature } from "@webiny/feature/admin";
import { WorkflowStatePresenter } from "./abstractions.js";
import { WorkflowStatePresenterImplementation } from "./WorkflowStatePresenter.js";

export const WorkflowStatePresenterFeature = createFeature({
    name: "Workflows/WorkflowStatePresenter",
    register(container) {
        container.register(WorkflowStatePresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(WorkflowStatePresenter)
        };
    }
});
