import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";
import { WorkflowEditorRepositoryFeature } from "./repository/feature.js";
import { ListWorkflowModelsFeature } from "./useCases/listWorkflowModels/feature.js";
import { GetWorkflowFeature } from "./useCases/getWorkflow/feature.js";
import { StoreWorkflowFeature } from "./useCases/storeWorkflow/feature.js";
import { DeleteWorkflowFeature } from "./useCases/deleteWorkflow/feature.js";
import { InspectRoutingFeature } from "./useCases/inspectRouting/feature.js";
import { FolderExistsFeature } from "./useCases/folderExists/feature.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the editor repository with the routing editor gateway (singletons), the six editor
 * use cases (transient) and the editor toasts (singleton). The configuration lookups are
 * `WorkflowConfigServicesFeature`; each app registers its editor gateway under
 * `WorkflowEditorAppGateway` (R347).
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
        WorkflowEditorRepositoryFeature.register(container);
        ListWorkflowModelsFeature.register(container);
        GetWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        InspectRoutingFeature.register(container);
        FolderExistsFeature.register(container);
        container.register(WorkflowEditorToasts).inSingletonScope();
    },
    resolve(container) {
        return {
            toasts: container.resolve(ToastsAbstraction)
        };
    }
});
