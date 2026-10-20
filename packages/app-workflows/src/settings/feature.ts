import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsRepositoryFeature } from "./repository/feature.js";
import { GetWorkflowSettingsFeature } from "./useCases/getWorkflowSettings/feature.js";
import { UpdateWorkflowSettingsFeature } from "./useCases/updateWorkflowSettings/feature.js";
import { WorkflowSettingsUseCases } from "./useCases/WorkflowSettingsUseCases.js";

/*
 * The app-neutral settings services, registered once by `WorkflowsAdminApp` inside the feature
 * flag gate (R211, R317, R354): the settings gateway and repository (singletons), the two settings
 * use cases (transient) and, until Task 14, the `WorkflowSettingsUseCases` bridge (R356). User
 * names and the user search use the shared configuration lookups.
 */
export const WorkflowSettingsServicesFeature = createFeature({
    name: "Workflows/WorkflowSettingsServices",
    register(container) {
        WorkflowSettingsRepositoryFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        UpdateWorkflowSettingsFeature.register(container);
        container.register(WorkflowSettingsUseCases).inSingletonScope();
    }
});
