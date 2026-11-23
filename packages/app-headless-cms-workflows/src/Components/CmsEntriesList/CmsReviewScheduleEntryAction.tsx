import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { useRowPublishDisabledReason } from "./useRowPublishDisabledReason.js";

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

interface ScheduleGateProps {
    children?: React.ReactNode;
}

const ScheduleGate = createReactiveComponent((props: ScheduleGateProps) => {
    const { entry } = useEntry();
    const reason = useRowPublishDisabledReason();

    // A published row offers "Schedule unpublish", which no review blocks.
    if (entry.meta.status === "published" || reason === null) {
        return <>{props.children}</>;
    }

    return null;
});

/*
 * The scheduler's per-row "Schedule publish" action (only present when the scheduler is
 * installed) needs what "Publish" needs (`useRowPublishDisabledReason`; the API refuses the
 * schedule with `Workflows/Review/PublishBlocked` otherwise). It is hidden rather than disabled
 * (R226). "Schedule unpublish" on a published row is left alone.
 */
export const CmsReviewScheduleEntryAction = EntryAction.createDecorator(Original => {
    return function CmsReviewScheduleEntryActionDecorator(props) {
        if (props.name !== "schedule") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<ScheduleGate>{props.element}</ScheduleGate>} />;
    };
});
