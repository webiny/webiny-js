import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { PublishGate } from "./PublishGate.js";

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

/*
 * The per-row "status" action (Publish / Unpublish) offers "Publish" disabled when the API would
 * refuse it. The bulk "Publish" has its own gate (`CmsReviewBulkPublishAction`).
 */
export const CmsReviewPublishEntryAction = EntryAction.createDecorator(Original => {
    return function CmsReviewPublishEntryActionDecorator(props) {
        if (props.name !== "status") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<PublishGate>{props.element}</PublishGate>} />;
    };
});
