import { createFeature } from "@webiny/feature/admin";
import { WorkflowStatesWidgetPresenter as Abstraction } from "./abstractions.js";
import { WorkflowStatesWidgetPresenter } from "./WorkflowStatesWidgetPresenter.js";

export const WorkflowStatesWidgetPresenterFeature = createFeature({
    name: "Workflows/WorkflowStatesWidgetPresenter",
    register(container) {
        container.register(WorkflowStatesWidgetPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
