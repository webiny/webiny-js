import { createFeature } from "@webiny/feature/admin";
import { WorkflowsEditorPresenter as Abstraction } from "./abstractions.js";
import { WorkflowsEditorPresenter } from "./WorkflowsEditorPresenter.js";

export const WorkflowsEditorPresenterFeature = createFeature({
    name: "Workflows/WorkflowsEditorPresenter",
    register(container) {
        container.register(WorkflowsEditorPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
