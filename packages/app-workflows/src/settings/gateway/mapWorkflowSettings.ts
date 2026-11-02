import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { WorkflowExclusionDto } from "./dto.js";
import type { WorkflowSettingsDto } from "./dto.js";

const mapWorkflowExclusion = (dto: WorkflowExclusionDto): WorkflowExclusion => {
    return {
        userId: dto.userId,
        reason: dto.reason ?? null,
        endsOn: dto.endsOn ?? null
    };
};

// The settings record as the server returned it, in its order; absent and `null` values are `null` (R317).
export const mapWorkflowSettings = (dto: WorkflowSettingsDto): WorkflowSettings => {
    return {
        exclusions: dto.exclusions.map(mapWorkflowExclusion)
    };
};
