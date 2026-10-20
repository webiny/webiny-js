import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsRepositoryFeature } from "./repository/feature.js";
import { GetWorkflowSettingsFeature } from "./useCases/getWorkflowSettings/feature.js";
import { UpdateWorkflowSettingsFeature } from "./useCases/updateWorkflowSettings/feature.js";

/*
 * The app-neutral settings services, registered once by `WorkflowsAdminApp` inside the feature
 * flag gate (R211, R317): the settings repository with its gateway (singletons) and the two
 * settings use cases (transient). User names and the user search use `ListWorkflowUsersUseCase`
 * of the configuration area.
 */
export const WorkflowSettingsServicesFeature = createFeature({
    name: "Workflows/WorkflowSettingsServices",
    register(container) {
        WorkflowSettingsRepositoryFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        UpdateWorkflowSettingsFeature.register(container);
    }
});
