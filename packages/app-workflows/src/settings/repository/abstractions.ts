import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";

/*
 * The settings area's data (R343): it calls the settings gateway and maps DTO to domain, and, for
 * a save, domain to DTO (R351). No cache. Every error of the gateway passes as it is: a
 * `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IWorkflowSettingsRepository {
    getSettings(params: GetSettingsParams): Promise<WorkflowSettings>;
    updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings>;
}

export const WorkflowSettingsRepository = createAbstraction<IWorkflowSettingsRepository>(
    "Workflows/WorkflowSettingsRepository"
);

export namespace WorkflowSettingsRepository {
    export type Interface = IWorkflowSettingsRepository;
}
