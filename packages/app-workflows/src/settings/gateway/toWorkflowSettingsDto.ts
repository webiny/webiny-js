import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { WorkflowExclusionDto } from "./dto.js";
import type { WorkflowSettingsDto } from "./dto.js";

const toWorkflowExclusionDto = (exclusion: WorkflowExclusion): WorkflowExclusionDto => {
    return {
        userId: exclusion.userId,
        reason: exclusion.reason,
        endsOn: exclusion.endsOn
    };
};

/*
 * The `WorkflowsSettingsInput` of a save, in the list's order. A `null` reason or end date is sent
 * as `null`; the server turns it into an absent key (R317).
 */
export const toWorkflowSettingsDto = (settings: WorkflowSettings): WorkflowSettingsDto => {
    return {
        exclusions: settings.exclusions.map(toWorkflowExclusionDto)
    };
};
