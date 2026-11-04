import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

interface ScheduleGateProps {
    children?: React.ReactNode;
}

const ScheduleGate = createReactiveComponent((props: ScheduleGateProps) => {
    const { entry } = useEntry();
    const meta: ICmsEntryMetaWithReview = entry.meta;

    if (!isReviewSelectable(meta.system?.workflow?.reviewState ?? null)) {
        return null;
    }

    return <>{props.children}</>;
});

/*
 * The scheduler's per-row "Schedule" action (only present when the scheduler is installed) is
 * hidden for a row whose review blocks publishing, the same rule as the row selection (D121).
 */
export const CmsReviewScheduleEntryAction = EntryAction.createDecorator(Original => {
    return function CmsReviewScheduleEntryActionDecorator(props) {
        if (props.name !== "schedule") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<ScheduleGate>{props.element}</ScheduleGate>} />;
    };
});
