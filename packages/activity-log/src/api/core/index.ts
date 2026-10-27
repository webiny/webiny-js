export { ActivityLogStorage } from "./abstractions.js";
export {
    DEFAULT_MAX_ENTRIES,
    childFieldsFor,
    contentHash,
    diffValues,
    labelForPath,
    longestIncreasingSubsequence,
    matchItems,
    rollUp,
    stripIds,
    templateIdOf
} from "./diff/index.js";
export type {
    DiffOptions,
    FieldDescriptor,
    FieldKind,
    ItemMatching,
    MatchedPair,
    RollUpResult,
    TemplateDescriptor
} from "./diff/index.js";
export { ActivityLogPersistenceError, ActivityLogReadError } from "./errors.js";
export { canonicalize } from "./hashing/canonicalize.js";
export { hashValue } from "./hashing/hashValue.js";
export {
    commonParentPath,
    encodePath,
    fieldSegment,
    indexSegment,
    itemSegment,
    listItemSegment,
    splitPathSegments
} from "./paths.js";
export type { PathSegment } from "./paths.js";
export type {
    ActivityAction,
    ActivityActor,
    ActivityEntryAction,
    ActivityRecord,
    ActivityRecordInput,
    ActivityReviewAction,
    ActivityTarget,
    ActivityTargetType,
    ChangesetEntry,
    ChangesetOperation
} from "./types.js";
