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
 * Sort key for one record: timestamp, then an intra-millisecond tick, then a random suffix.
 *
 * All three parts are load-bearing, and the key needs two different properties that one part
 * cannot provide together:
 *
 *   - **Unique**, or a keyset cursor drops every record sharing the boundary value.
 *   - **Monotonic**, or records written inside one millisecond come back scrambled.
 *
 * A timestamp alone is neither: `toISOString()` has millisecond precision and a bulk action writes
 * many records inside one. A timestamp plus a random suffix is unique but not ordered, which shows
 * up as a timeline that lists rapid saves out of sequence. So the tick orders writes within a
 * millisecond for this process, and the random suffix keeps the key unique across processes, where
 * sub-millisecond ordering is undefined anyway.
 *
 * Fixed width on the tick matters: the comparison is lexicographic, so `10` must not sort before
 * `9`.
 */
const TICK_WIDTH = 6;

let lastTimestamp = "";
let tick = 0;

const sequenceFor = (timestamp: string): string => {
    if (timestamp === lastTimestamp) {
        tick++;
    } else {
        lastTimestamp = timestamp;
        tick = 0;
    }

    const orderedTick = String(tick).padStart(TICK_WIDTH, "0");

    return `${timestamp}#${orderedTick}#${generateAlphaNumericLowerCaseId(6)}`;
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
        truncated: record.truncated,
        subjectId: record.subject?.id ?? null,
        subjectLabel: record.subject?.label ?? null,
        hasNote: record.hasNote ?? null
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
        truncated: values.truncated === true,
        ...(values.subjectId
            ? { subject: { id: values.subjectId, label: values.subjectLabel ?? "" } }
            : {}),
        ...(values.hasNote === null || values.hasNote === undefined
            ? {}
            : { hasNote: values.hasNote })
    };
};
