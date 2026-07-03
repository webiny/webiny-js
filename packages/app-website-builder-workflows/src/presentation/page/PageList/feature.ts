import { createFeature } from "@webiny/feature/admin";
import { WorkflowStateListPagesFieldSelection } from "./WorkflowStateListPagesFieldSelection.js";
import { TableRowMapperWorkflowDecorator } from "./TableRowMapperDecorator.js";

export const PageListWorkflowsFeature = createFeature({
    name: "PageListWorkflows",
    register(container) {
        container.register(WorkflowStateListPagesFieldSelection);
        container.registerDecorator(TableRowMapperWorkflowDecorator);
    }
});
