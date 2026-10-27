export { ActivityLogAppFeature } from "./ActivityLogAppFeature.js";
export type { IActivityLogAppFeatureParams } from "./ActivityLogAppFeature.js";
/*
  Enumerated rather than `export *`.

  A star re-export makes the package's public surface whatever the barrel happens to contain
  today, so a helper added for one call site inside `core/` silently becomes API everybody may
  depend on. Listing the names makes widening the surface a decision someone takes on purpose.
*/
export {
    ActivityLogPersistenceError,
    ActivityLogReadError,
    ActivityLogStorage,
    DEFAULT_MAX_ENTRIES,
    canonicalize,
    childFieldsFor,
    commonParentPath,
    contentHash,
    diffValues,
    encodePath,
    fieldSegment,
    hashValue,
    indexSegment,
    itemSegment,
    labelForPath,
    listItemSegment,
    longestIncreasingSubsequence,
    matchItems,
    rollUp,
    splitPathSegments,
    stripIds,
    templateIdOf
} from "./core/index.js";
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
    ChangesetOperation,
    DiffOptions,
    FieldDescriptor,
    FieldKind,
    ItemMatching,
    MatchedPair,
    PathSegment,
    RollUpResult,
    TemplateDescriptor
} from "./core/index.js";
export { ACTIVITY_LOG_MODEL_ID, ActivityLogModelProvider } from "./storage/privateModel/index.js";
/*
  Exported for the scheduled sweep's inbound handler, which lives wherever the runtime's
  scheduler does — `api-event-handler-aws` on AWS — because this package carries no infrastructure
  dependency and should not start now.
*/
export { SWEEP_STALE_VALUES_TASK_ID } from "./cms/summary/SweepStaleValuesTaskDefinition.js";
