import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type {
    ActivityRecord,
    ActivityRecordInput,
    ActivitySummaryState,
    ActivityTargetType,
    ChangesetEntry,
    SummaryKind,
    SummarySkipReason,
    SummaryValueEntry
} from "~/api/core/types.js";
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
        hasNote: record.hasNote ?? null,
        summary: record.summary ?? null,
        summaryKind: record.summaryKind ?? null,
        summaryRunId: record.summaryRunId ?? null,
        summaryTaskId: record.summaryState?.taskId ?? null,
        summaryValues: record.summaryState?.values ?? null,
        summaryValuesWrittenOn: record.summaryState?.valuesWrittenOn ?? null,
        summaryReason: record.summaryState?.reason ?? null
    };
};

/**
 * Transient values, read back defensively.
 *
 * Same reasoning as the changeset: this is JSON in a CMS field, and a half-written or hand-edited
 * value must degrade to "no values" rather than take a sweep or a job down with it.
 */
const readSummaryValues = (value: unknown): SummaryValueEntry[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (item): item is SummaryValueEntry =>
            item !== null && typeof item === "object" && typeof (item as any).path === "string"
    );
};

/**
 * Reassembles the job state, or omits it entirely.
 *
 * Omitted rather than emitted empty so that "has a job in flight" stays a presence check on the
 * record, matching how the type is documented.
 */
const readSummaryState = (values: ActivityRecordValues): ActivitySummaryState | undefined => {
    const storedValues = readSummaryValues(values.summaryValues);

    const state: ActivitySummaryState = {
        ...(values.summaryTaskId ? { taskId: values.summaryTaskId } : {}),
        ...(storedValues.length > 0 ? { values: storedValues } : {}),
        ...(values.summaryValuesWrittenOn
            ? { valuesWrittenOn: values.summaryValuesWrittenOn }
            : {}),
        ...(values.summaryReason ? { reason: values.summaryReason as SummarySkipReason } : {})
    };

    return Object.keys(state).length > 0 ? state : undefined;
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
            : { hasNote: values.hasNote }),
        ...(values.summary ? { summary: values.summary } : {}),
        ...(values.summaryKind ? { summaryKind: values.summaryKind as SummaryKind } : {}),
        ...(values.summaryRunId ? { summaryRunId: values.summaryRunId } : {}),
        ...(readSummaryState(values) ? { summaryState: readSummaryState(values) } : {})
    };
};
