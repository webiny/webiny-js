import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { ActivityLogAdminFeature } from "~/feature.js";
import { ActivityHeaderToggle } from "~/components/ActivityHeaderToggle.js";
import { ContentEntryFormActivity } from "~/components/ContentEntryFormActivity.js";

export { ActivityTimeline, ActivityTimelineView } from "~/components/ActivityTimeline.js";
export { useActivityTimeline } from "~/hooks/useActivityTimeline.js";
export { buildTimelineView, hasActiveFilters } from "~/hooks/buildTimelineView.js";
export type {
    TimelineFilters,
    TimelineView,
    TimelineViewGroup
} from "~/hooks/buildTimelineView.js";
export * from "~/timeline/index.js";

/**
 * Mount point for the admin side of the activity log.
 *
 * Two pieces, because the panel and the control that opens it live in different parts of the entry
 * editor: the toggle goes in the header alongside revisions and publishing, and the panel goes
 * beside the form. They share one open/closed state through a presenter in
 * `ActivityLogAdminFeature`.
 *
 * No feature-flag check here, unlike `CmsWorkflows`: nothing on the licence governs this feature
 * yet, so the admin side follows whatever the API side was told. The timeline is harmless without
 * it — the query does not exist, so it renders an error state — but that is a reason to close the
 * gate properly, not to add a check that gates on the project's own config.
 */
export const ActivityLog = () => {
    return (
        <>
            <RegisterFeature feature={ActivityLogAdminFeature} />
            <ActivityHeaderToggle />
            <ContentEntryFormActivity />
        </>
    );
};
