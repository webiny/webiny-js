import { createFeature } from "@webiny/feature/admin";
import { WorkflowsEditorPresenter } from "./abstractions.js";
import { WorkflowsEditorPresenterImplementation } from "./WorkflowsEditorPresenter.js";

export const WorkflowsEditorPresenterFeature = createFeature({
    name: "Workflows/WorkflowsEditorPresenter",
    register(container) {
        container.register(WorkflowsEditorPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(WorkflowsEditorPresenter)
        };
    }
});
