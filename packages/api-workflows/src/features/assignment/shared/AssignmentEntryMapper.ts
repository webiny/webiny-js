import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";
import { ActorEntryMapper, type ActorEntryValues } from "~/features/shared/ActorEntryMapper.js";

export interface AssignmentEntryValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    userId: string | null;
    assignedOn: string | Date | null;
    source: string;
    by: ActorEntryValues | null;
    reason: string | null;
}

export class AssignmentEntryMapper {
    public static toValues(values: AssignmentRecordValues): AssignmentEntryValues {
        return {
            reviewId: values.reviewId,
            workflowId: values.workflowId,
            stepId: values.stepId,
            userId: values.userId,
            assignedOn: values.assignedOn,
            source: values.source,
            by: values.by ? ActorEntryMapper.toEntry(values.by) : null,
            reason: values.reason
        };
    }

    public static fromEntry(entry: CmsEntry<AssignmentEntryValues>): AssignmentRecord {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            reviewId: entry.values.reviewId,
            workflowId: entry.values.workflowId,
            stepId: entry.values.stepId,
            userId: entry.values.userId ?? null,
            assignedOn: toIsoString(entry.values.assignedOn) ?? entry.createdOn,
            source: entry.values.source,
            by: ActorEntryMapper.fromEntry(entry.values.by),
            reason: entry.values.reason ?? null
        };
    }
}
