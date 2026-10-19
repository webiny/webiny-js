import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";
import { mapWorkflowSettings } from "~/settings/gateway/mapWorkflowSettings.js";
import { toWorkflowSettingsDto } from "~/settings/gateway/toWorkflowSettingsDto.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { toOperationError } from "~/editor/useCases/toOperationError.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * One implementation for every app: the settings live on the shared `workflows` root and the
 * gateway is bound once, so the class is not subclassed (R237 concerns a class bound under more
 * than one token). A read always includes the expired entries: a save replaces the whole record,
 * so an entry the page never loaded would be deleted by the next save (R317).
 */
class WorkflowSettingsUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(private gateway: WorkflowSettingsGateway.Interface) {}

    public async getSettings(): Promise<WorkflowSettings> {
        const params: GetSettingsParams = { includeExpired: true };
        const envelope = await this.gateway.getSettings(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowSettings(envelope.data);
    }

    public async updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> {
        const data = toWorkflowSettingsDto(settings);
        const envelope = await this.gateway.updateSettings(data);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowSettings(envelope.data);
    }
}

export const WorkflowSettingsUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowSettingsUseCasesImpl,
    dependencies: [WorkflowSettingsGateway]
});
