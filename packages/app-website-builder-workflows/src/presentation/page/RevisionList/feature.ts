import { createFeature } from "@webiny/feature/admin";
import { RevisionListPresenterDecorator } from "./RevisionListPresenterDecorator.js";

export const RevisionListWorkflowsFeature = createFeature({
    name: "RevisionListWorkflows",
    register(container) {
        container.registerDecorator(RevisionListPresenterDecorator);
    }
});
