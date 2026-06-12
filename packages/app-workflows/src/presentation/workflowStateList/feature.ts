import { createFeature } from "@webiny/feature/admin";
import { WorkflowStateListPresenter } from "./abstractions.js";
import { WorkflowStateListPresenterImplementation } from "./WorkflowStateListPresenter.js";

export const WorkflowStateListPresenterFeature = createFeature({
    name: "Workflows/WorkflowStateListPresenter",
    register(container) {
        container.register(WorkflowStateListPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(WorkflowStateListPresenter)
        };
    }
});
