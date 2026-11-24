import type React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { usePage } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { usePageRowPublishDisabledReason } from "./usePageRowPublishDisabledReason.js";

export interface PageScheduleGateProps {
    element: React.ReactElement | undefined;
}

/*
 * The scheduler's per-row "Schedule publish" needs what "Publish" needs
 * (`usePageRowPublishDisabledReason`; the API refuses the schedule with
 * `Workflows/Review/PublishBlocked` otherwise). It is hidden rather than disabled (R226).
 * "Schedule unpublish" on a published row is left alone.
 */
export const PageScheduleGate = createReactiveComponent((props: PageScheduleGateProps) => {
    const { page } = usePage();
    const reason = usePageRowPublishDisabledReason();

    if (page.status === WbPageStatus.Published || reason === null) {
        return props.element ?? null;
    }

    return null;
});
