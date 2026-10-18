import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigGateway } from "./gateway/WorkflowConfigGatewayImpl.js";
import { WorkflowConfigUseCases as ConfigUseCasesAbstraction } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCasesImpl.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/WorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToastsImpl.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the shared config gateway and use cases and the editor toasts. All are singletons.
 * The per-app editor use cases are registered by each app package (Task 7).
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
        container.register(WorkflowConfigGateway).inSingletonScope();
        container.register(WorkflowConfigUseCases).inSingletonScope();
        container.register(WorkflowEditorToasts).inSingletonScope();
    },
    resolve(container) {
        return {
            configUseCases: container.resolve(ConfigUseCasesAbstraction),
            toasts: container.resolve(ToastsAbstraction)
        };
    }
});
