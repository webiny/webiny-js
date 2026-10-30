import type { WorkflowSettings } from "~/settings/domain/types.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { GetSettingsParams } from "~/settings/domain/GetSettingsParams.js";
import { mapWorkflowSettings } from "~/settings/gateway/mapWorkflowSettings.js";
import { toWorkflowSettingsDto } from "~/settings/gateway/toWorkflowSettingsDto.js";
import { WorkflowSettingsRepository as RepositoryAbstraction } from "./abstractions.js";

/*
 * One implementation for every app: the settings live on the shared `workflows` root and the
 * gateway is bound once (R317). A save replaces the whole record and the server returns it as
 * saved (D106, A108), so the saved record is mapped and returned.
 */
class WorkflowSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: WorkflowSettingsGateway.Interface) {}

    public async getSettings(params: GetSettingsParams): Promise<WorkflowSettings> {
        const dto = await this.gateway.getSettings(params);
        return mapWorkflowSettings(dto);
    }

    public async updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> {
        const data = toWorkflowSettingsDto(settings);
        const dto = await this.gateway.updateSettings(data);
        return mapWorkflowSettings(dto);
    }
}

export const WorkflowSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: WorkflowSettingsRepositoryImpl,
    dependencies: [WorkflowSettingsGateway]
});
