import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { WorkflowSettingsDto } from "./dto.js";

export interface GetSettingsParams {
    // Also the entries whose end date has passed; the settings page always asks for them (R317).
    includeExpired: boolean;
}

/*
 * The settings operations on the shared `workflows` root (R317). Every method resolves with the
 * envelope, also for a server error, and rejects only on a transport failure (R204).
 */
export interface IWorkflowSettingsGateway {
    getSettings(params: GetSettingsParams): Promise<EditorEnvelope<WorkflowSettingsDto>>;
    updateSettings(data: WorkflowSettingsDto): Promise<EditorEnvelope<WorkflowSettingsDto>>;
}
