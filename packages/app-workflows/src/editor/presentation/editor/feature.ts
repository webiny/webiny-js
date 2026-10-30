import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorPresenter as Abstraction } from "./abstractions.js";
import { WorkflowEditorPresenter } from "./WorkflowEditorPresenter.js";

// Transient (R212): every `useFeature` resolve is a new presenter, so views never share state.
export const WorkflowEditorPresenterFeature = createFeature({
    name: "Workflows/WorkflowEditorPresenter",
    register(container) {
        container.register(WorkflowEditorPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
