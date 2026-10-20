import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigUseCases as ConfigUseCasesAbstraction } from "./useCases/abstractions.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the editor toasts and, until Task 14, the config bridge (R356, R364), which runs on
 * the use cases of `WorkflowConfigServicesFeature`. Both are singletons. The config gateway is
 * registered by the config area. The per-app editor use cases are registered by each app package.
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
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
