import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { ActivityLogAdminFeature } from "~/admin/feature.js";
import { ActivityHeaderToggle } from "~/admin/components/ActivityHeaderToggle.js";
import { ContentEntryFormActivity } from "~/admin/components/ContentEntryFormActivity.js";

export { ActivityTimeline } from "~/admin/components/ActivityTimeline.js";
export { ActivityTimelineView } from "~/admin/components/timeline/ActivityTimelineView.js";
export { useActivityTimeline } from "~/admin/hooks/useActivityTimeline.js";
export { buildTimelineView, hasActiveFilters } from "~/admin/hooks/buildTimelineView.js";
export type {
    TimelineFilters,
    TimelineView,
    TimelineViewGroup
} from "~/admin/hooks/buildTimelineView.js";
/*
  Enumerated rather than `export *`, for the same reason as on the API side: a star re-export
  makes the public surface whatever `timeline/` happens to hold, and most of what it holds is
  shaping detail this package uses on itself.
*/
export {
    collapseConsecutive,
    deriveTimelineState,
    describeAction,
    describeActor,
    describeChange,
    describeChangeset,
    describeGroup,
    describeTimeline,
    discloseItem,
    elideAncestors,
    formatDateRange,
    formatNameList,
    groupByRevision,
    humaniseFieldId,
    initialsOf,
    isRedactedActor,
    parseVersion,
    summariseItem,
    writeSignature
} from "~/admin/timeline/index.js";
export type {
    ActionBadge,
    ActionBadgeTone,
    CollapseOptions,
    DeriveTimelineStateParams,
    DescribedAction,
    DescribedActor,
    DescribedChange,
    DescribedGroup,
    DisclosedFieldGroup,
    DisclosedRun,
    DisclosedSave,
    ItemDisclosure,
    ItemSummary,
    MachineIcon,
    SentenceKind,
    SentenceSegment,
    TimelineActor,
    TimelineChange,
    TimelineCoverage,
    TimelineGroup,
    TimelineItem,
    TimelineRecord,
    TimelineSentence,
    TimelineState,
    TimelineStatus,
    TimelineSubject,
    WrittenTarget
} from "~/admin/timeline/index.js";

/**
 * Mount point for the admin side of the activity log.
 *
 * Two pieces, because the panel and the control that opens it live in different parts of the entry
 * editor: the toggle goes in the header alongside revisions and publishing, and the panel goes
 * beside the form. They share one open/closed state through a presenter in
 * `ActivityLogAdminFeature`.
 *
 * Gated on `collaboration.activityLog`, the same flag the API side registers against, following
 * `CmsWorkflows`. Both halves have to agree: without this the header would offer an Activity button
 * whose query does not exist on an unentitled installation, which reads as a broken feature rather
 * than an unsold one.
 */
export const ActivityLog = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("collaboration.activityLog")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={ActivityLogAdminFeature} />
            <ActivityHeaderToggle />
            <ContentEntryFormActivity />
        </>
    );
};
