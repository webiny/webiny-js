import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
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
/**
 * Sort key for one record: its timestamp, then a random suffix.
 *
 * ISO-8601 UTC strings sort lexicographically in time order, so prefixing with the timestamp keeps
 * the ordering right, and the suffix makes the key unique. Uniqueness is the point — a keyset
 * cursor over a non-unique key drops every record that shares the boundary value, and a bulk
 * action writes many records inside a single millisecond.
 */
const sequenceFor = (timestamp: string): string => {
    return `${timestamp}#${generateAlphaNumericLowerCaseId(8)}`;
};

export const recordToValues = (record: ActivityRecordInput): ActivityRecordValues => {
    return {
        sequence: sequenceFor(record.timestamp),
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

export const sequenceOf = (entry: CmsEntry<ActivityRecordValues>): string => {
    return entry.values.sequence;
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
