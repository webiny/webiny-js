import { createFeature } from "@webiny/feature/admin";
import { WorkflowStatesWidgetPresenter } from "./abstractions.js";
import { WorkflowStatesWidgetPresenterImplementation } from "./WorkflowStatesWidgetPresenter.js";

export const WorkflowStatesWidgetPresenterFeature = createFeature({
    name: "Workflows/WorkflowStatesWidgetPresenter",
    register(container) {
        container.register(WorkflowStatesWidgetPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(WorkflowStatesWidgetPresenter)
        };
    }
});
