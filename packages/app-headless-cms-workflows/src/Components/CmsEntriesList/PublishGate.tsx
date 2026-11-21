import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { useRowPublishDisabledReason } from "./useRowPublishDisabledReason.js";
import { PublishBlocked } from "./PublishBlocked.js";

export interface PublishGateProps {
    children?: React.ReactNode;
}

/*
 * Leaves the base status action alone when it shows "Unpublish" or nothing (no publish
 * permission); otherwise shows "Publish" disabled with the reason whenever the API would refuse it
 * (`Workflows/Review/PublishBlocked`): a revision whose review is in progress or rejected, or a
 * revision of a bound model with no approved review.
 */
export const PublishGate = createReactiveComponent((props: PublishGateProps) => {
    const { entry } = useEntry();
    const { canPublish, canUnpublish } = usePermission();
    const reason = useRowPublishDisabledReason();

    const showsUnpublish = entry.meta.status === "published" && canUnpublish("cms.contentEntry");

    if (showsUnpublish || !canPublish("cms.contentEntry") || reason === null) {
        return <>{props.children}</>;
    }

    return <PublishBlocked reason={reason} />;
});
