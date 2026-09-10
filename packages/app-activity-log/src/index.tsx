import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { ActivityLogAdminFeature } from "~/feature.js";
import { ContentEntryFormActivity } from "~/components/ContentEntryFormActivity.js";

export { ActivityTimeline } from "~/components/ActivityTimeline.js";
export { useActivityTimeline } from "~/hooks/useActivityTimeline.js";
export { buildTimelineView, hasActiveFilters } from "~/hooks/buildTimelineView.js";
export type { TimelineFilters, TimelineView } from "~/hooks/buildTimelineView.js";
export * from "~/timeline/index.js";

/**
 * Mount point for the admin side of the activity log.
 *
 * No feature-flag check here, unlike `CmsWorkflows`: the entitlement gate is still open on the API
 * side, so gating the UI on a flag that resolves to enabled for everyone would be theatre. The
 * timeline is harmless without the entitlement — the query does not exist, so it renders an error
 * state — but that is a reason to close the gate, not to pretend it is closed.
 */
export const ActivityLog = () => {
    return (
        <>
            <RegisterFeature feature={ActivityLogAdminFeature} />
            <ContentEntryFormActivity />
        </>
    );
};
