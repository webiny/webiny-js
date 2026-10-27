import type { GetSettingsParams } from "~/settings/domain/GetSettingsParams.js";
import type { WorkflowSettingsDto } from "./dto.js";

/*
 * The settings operations on the shared `workflows` root (R317). Every method resolves with the
 * envelope's data. It throws a `GraphQLOperationError` for an error envelope or an envelope
 * without data, and lets a transport failure pass as it is (R346).
 */
export interface IWorkflowSettingsGateway {
    getSettings(params: GetSettingsParams): Promise<WorkflowSettingsDto>;
    updateSettings(data: WorkflowSettingsDto): Promise<WorkflowSettingsDto>;
}
