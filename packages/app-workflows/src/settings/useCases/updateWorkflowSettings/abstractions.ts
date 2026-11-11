import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowSettings } from "~/settings/domain/types.js";

/*
 * Replaces the tenant's workflow settings record with the given one and returns it as saved
 * (D106, A108). Throws a `GraphQLOperationError` for a server error and the transport `Error` as
 * is (R360).
 */
export interface IUpdateWorkflowSettingsUseCase {
    execute(params: WorkflowSettings): Promise<WorkflowSettings>;
}

export const UpdateWorkflowSettingsUseCase = createAbstraction<IUpdateWorkflowSettingsUseCase>(
    "Workflows/UpdateWorkflowSettingsUseCase"
);

export namespace UpdateWorkflowSettingsUseCase {
    export type Interface = IUpdateWorkflowSettingsUseCase;
    export type Params = WorkflowSettings;
}
