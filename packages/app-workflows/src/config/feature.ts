import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigRepositoryFeature } from "./repository/feature.js";
import { ListAiModelsFeature } from "./useCases/listAiModels/feature.js";
import { ListAiToolsFeature } from "./useCases/listAiTools/feature.js";
import { ListAutomationDefinitionsFeature } from "./useCases/listAutomationDefinitions/feature.js";
import { ListNotificationTransportsFeature } from "./useCases/listNotificationTransports/feature.js";
import { ListStepTypesFeature } from "./useCases/listStepTypes/feature.js";
import { ListWorkflowTeamsFeature } from "./useCases/listWorkflowTeams/feature.js";
import { ListWorkflowUsersFeature } from "./useCases/listWorkflowUsers/feature.js";

/*
 * The configuration area, registered once by `WorkflowsAdminApp` inside the feature flag gate
 * (R211, R354): the config gateway and repository (singletons) and the seven lookup use cases
 * (transient), used by the workflow editor and the settings page.
 */
export const WorkflowConfigServicesFeature = createFeature({
    name: "Workflows/WorkflowConfigServices",
    register(container) {
        WorkflowConfigRepositoryFeature.register(container);
        ListStepTypesFeature.register(container);
        ListAutomationDefinitionsFeature.register(container);
        ListNotificationTransportsFeature.register(container);
        ListWorkflowTeamsFeature.register(container);
        ListWorkflowUsersFeature.register(container);
        ListAiModelsFeature.register(container);
        ListAiToolsFeature.register(container);
    }
});
