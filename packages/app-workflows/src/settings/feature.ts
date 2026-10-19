import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsGateway } from "./gateway/WorkflowSettingsGateway.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./useCases/abstractions.js";
import { WorkflowSettingsUseCases } from "./useCases/WorkflowSettingsUseCases.js";

/*
 * The app-neutral settings services, registered once by `WorkflowsAdminApp` inside the feature
 * flag gate (R211, R317): the settings gateway and use cases, both singletons. User names and the
 * user search reuse the shared `WorkflowConfigUseCases.listUsers`.
 */
export const WorkflowSettingsServicesFeature = createFeature({
    name: "Workflows/WorkflowSettingsServices",
    register(container) {
        container.register(WorkflowSettingsGateway).inSingletonScope();
        container.register(WorkflowSettingsUseCases).inSingletonScope();
    },
    resolve(container) {
        return {
            settingsUseCases: container.resolve(UseCasesAbstraction)
        };
    }
});
