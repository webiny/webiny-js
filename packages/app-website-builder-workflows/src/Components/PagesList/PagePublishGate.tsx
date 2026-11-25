import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { usePage } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { HasPermission } from "@webiny/app-website-builder/presentation/security/HasPermission.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { usePageRowPublishDisabledReason } from "./usePageRowPublishDisabledReason.js";
import { PagePublishBlocked } from "./PagePublishBlocked.js";

export interface PagePublishGateProps {
    element: React.ReactElement | undefined;
}

/*
 * Leaves the base "Change status" action alone when it shows "Unpublish"; otherwise shows
 * "Publish" disabled with the reason whenever the API would refuse it
 * (`Workflows/Review/PublishBlocked`): a page whose review is in progress or rejected, or a page
 * with no approved review while a workflow binds the pages. Like the base action, the disabled
 * "Publish" needs the publish permission.
 */
export const PagePublishGate = createReactiveComponent((props: PagePublishGateProps) => {
    const { page } = usePage();
    const reason = usePageRowPublishDisabledReason();

    if (page.status === WbPageStatus.Published || reason === null) {
        return props.element ?? null;
    }

    return (
        <HasPermission entity={"page"} action={"publish"}>
            <PagePublishBlocked reason={reason} />
        </HasPermission>
    );
});
