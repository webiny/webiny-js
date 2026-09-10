import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type {
    ActivityRecord,
    ActivityRecordInput,
    ActivityTargetType,
    ChangesetEntry
} from "~/core/types.js";
import type { ActivityRecordValues } from "./abstractions.js";

/**
 * Translates between the record shape and the private model's entry values.
 *
 * Kept as a free function pair rather than a class because it holds no state and is the seam a
 * replacement storage mechanism throws away wholesale.
 */
export const recordToValues = (record: ActivityRecordInput): ActivityRecordValues => {
    return {
        targetType: record.targetType,
        targetId: record.targetId,
        revision: record.revision,
        timestamp: record.timestamp,
        actorId: record.actor.id,
        actorType: record.actor.type,
        actorDisplayName: record.actor.displayName === "" ? null : record.actor.displayName,
        action: record.action,
        source: record.source,
        correlationId: record.correlationId,
        changeset: record.changeset,
        truncated: record.truncated
    };
};

const readChangeset = (value: unknown): ChangesetEntry[] => {
    // The model stores this as JSON, so a hand-edited or partially written record must not take
    // the whole timeline down. An unreadable changeset reads as "no detail", not as an error.
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (item): item is ChangesetEntry =>
            item !== null &&
            typeof item === "object" &&
            typeof (item as ChangesetEntry).path === "string"
    );
};

export const entryToRecord = (entry: CmsEntry<ActivityRecordValues>): ActivityRecord => {
    const values = entry.values;

    return {
        id: entry.id,
        targetType: values.targetType as ActivityTargetType,
        targetId: values.targetId,
        revision: values.revision,
        timestamp: values.timestamp,
        actor: {
            id: values.actorId,
            type: values.actorType,
            displayName: values.actorDisplayName ?? ""
        },
        action: values.action,
        source: values.source,
        correlationId: values.correlationId,
        changeset: readChangeset(values.changeset),
        truncated: values.truncated === true
    };
};
