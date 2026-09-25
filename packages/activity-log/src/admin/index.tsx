import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { ActivityLogAdminFeature } from "~/admin/feature.js";
import { ActivityHeaderToggle } from "~/admin/components/ActivityHeaderToggle.js";
import { ContentEntryFormActivity } from "~/admin/components/ContentEntryFormActivity.js";

export { ActivityTimeline, ActivityTimelineView } from "~/admin/components/ActivityTimeline.js";
export { useActivityTimeline } from "~/admin/hooks/useActivityTimeline.js";
export { buildTimelineView, hasActiveFilters } from "~/admin/hooks/buildTimelineView.js";
export type {
    TimelineFilters,
    TimelineView,
    TimelineViewGroup
} from "~/admin/hooks/buildTimelineView.js";
export * from "~/admin/timeline/index.js";

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
