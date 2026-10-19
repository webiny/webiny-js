import type { WorkflowSettings } from "~/settings/domain/types.js";

/*
 * The settings page's operations (R317). Every method throws a `GraphQLOperationError` for a
 * server error or the transport `Error` as is (R204). `getSettings` always returns the expired
 * entries too; `updateSettings` replaces the whole record and returns it as saved (D106, A108).
 */
export interface IWorkflowSettingsUseCases {
    getSettings(): Promise<WorkflowSettings>;
    updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings>;
}
