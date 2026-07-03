import { createFeature } from "@webiny/feature/admin";
import { WorkflowStateListPresenter as Abstraction } from "./abstractions.js";
import { WorkflowStateListPresenter } from "./WorkflowStateListPresenter.js";

export const WorkflowStateListPresenterFeature = createFeature({
    name: "Workflows/WorkflowStateListPresenter",
    register(container) {
        container.register(WorkflowStateListPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
