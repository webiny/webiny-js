import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorRepositoryFeature } from "./repository/feature.js";
import { DeleteWorkflowFeature } from "./useCases/deleteWorkflow/feature.js";
import { FolderExistsFeature } from "./useCases/folderExists/feature.js";
import { GetWorkflowFeature } from "./useCases/getWorkflow/feature.js";
import { InspectRoutingFeature } from "./useCases/inspectRouting/feature.js";
import { ListWorkflowModelsFeature } from "./useCases/listWorkflowModels/feature.js";
import { StoreWorkflowFeature } from "./useCases/storeWorkflow/feature.js";
import { WorkflowConfigUseCases as ConfigUseCasesAbstraction } from "./useCases/abstractions.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the editor's routing gateway and repository (singletons) and its six use cases
 * (transient), the config bridge and the editor toasts. The app packages register only their
 * editor gateway under `WorkflowEditorAppGateway` (R347).
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
        container.register(WorkflowConfigUseCases).inSingletonScope();
        container.register(WorkflowEditorToasts).inSingletonScope();
        WorkflowEditorRepositoryFeature.register(container);
        ListWorkflowModelsFeature.register(container);
        GetWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        InspectRoutingFeature.register(container);
        FolderExistsFeature.register(container);
    },
    resolve(container) {
        return {
            configUseCases: container.resolve(ConfigUseCasesAbstraction),
            toasts: container.resolve(ToastsAbstraction)
        };
    }
});
