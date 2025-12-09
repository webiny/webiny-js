import { createFeature } from "@webiny/feature/admin";
import { PageListPresenterDecorator } from "./PageListPresenterDecorator.js";
import { WorkflowStateListPagesFieldSelection } from "./WorkflowStateListPagesFieldSelection.js";

export const PageListWorkflowsFeature = createFeature({
    name: "PageListWorkflows",
    register(container) {
        container.registerDecorator(PageListPresenterDecorator);
        container.register(WorkflowStateListPagesFieldSelection);
    }
});
