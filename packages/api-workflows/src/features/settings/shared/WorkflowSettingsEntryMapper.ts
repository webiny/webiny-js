import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";

export interface WorkflowSettingsEntryExclusion {
    userId: string;
    reason: string | null;
    endsOn: string | Date | null;
}

export interface WorkflowSettingsEntryValues {
    exclusions: WorkflowSettingsEntryExclusion[] | null;
}

export class WorkflowSettingsEntryMapper {
    public static toValues(settings: WorkflowSettings): WorkflowSettingsEntryValues {
        return {
            exclusions: settings.exclusions.map(exclusion => ({
                userId: exclusion.userId,
                reason: exclusion.reason ?? null,
                endsOn: exclusion.endsOn ?? null
            }))
        };
    }

    public static fromEntry(entry: CmsEntry<WorkflowSettingsEntryValues>): WorkflowSettings {
        return {
            exclusions: (entry.values.exclusions ?? []).map(exclusion =>
                WorkflowSettingsEntryMapper.exclusionFromEntry(exclusion)
            )
        };
    }

    private static exclusionFromEntry(value: WorkflowSettingsEntryExclusion): WorkflowExclusion {
        const endsOn = toIsoString(value.endsOn);
        return {
            userId: value.userId,
            ...(value.reason ? { reason: value.reason } : {}),
            ...(endsOn ? { endsOn } : {})
        };
    }
}
