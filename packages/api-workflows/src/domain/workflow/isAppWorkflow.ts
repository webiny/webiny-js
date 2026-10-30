import type { WorkflowValues } from "./types.js";

/** Whether a namespace id belongs to the app, e.g. `cms.<modelId>` or `wb.page`. */
export type AppNamespacePredicate = (model: string) => boolean;

/** Every model is one of the app's namespaces; an empty list is left to the engine's validation. */
export const belongsToApp = (models: string[], isAppNamespace: AppNamespacePredicate): boolean => {
    return models.every(isAppNamespace);
};

/** A stored workflow of the app (R46): bound to at least one model, all of them the app's. */
export const isAppWorkflow = (
    workflow: WorkflowValues,
    isAppNamespace: AppNamespacePredicate
): boolean => {
    return workflow.models.length > 0 && belongsToApp(workflow.models, isAppNamespace);
};
