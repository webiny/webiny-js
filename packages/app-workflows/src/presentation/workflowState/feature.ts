import { createFeature } from "@webiny/feature/admin";
import { WorkflowStatePresenter as Abstraction } from "./abstractions.js";
import { WorkflowStatePresenter } from "./WorkflowStatePresenter.js";

export const WorkflowStatePresenterFeature = createFeature({
    name: "Workflows/WorkflowStatePresenter",
    register(container) {
        container.register(WorkflowStatePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
