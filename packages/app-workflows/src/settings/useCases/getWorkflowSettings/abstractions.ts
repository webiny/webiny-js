import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowSettings } from "~/settings/domain/types.js";

/*
 * Reads the tenant's workflow settings, always with the expired entries (R317, R351): a save
 * replaces the whole record, so an entry the page never loaded would be deleted by the next save.
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IGetWorkflowSettingsUseCase {
    execute(): Promise<WorkflowSettings>;
}

export const GetWorkflowSettingsUseCase = createAbstraction<IGetWorkflowSettingsUseCase>(
    "Workflows/GetWorkflowSettingsUseCase"
);

export namespace GetWorkflowSettingsUseCase {
    export type Interface = IGetWorkflowSettingsUseCase;
}
