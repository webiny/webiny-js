import { createFeature } from "@webiny/feature/admin";
import { CmsWorkflowsEditorPresenter as Abstraction } from "./abstractions.js";
import { CmsWorkflowsEditorPresenter } from "./CmsWorkflowsEditorPresenter.js";

export const CmsWorkflowsEditorPresenterFeature = createFeature({
    name: "CmsWorkflowsEditor/Presenter",
    register(container) {
        container.register(CmsWorkflowsEditorPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
