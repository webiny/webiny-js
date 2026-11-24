import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { BulkPublishGate } from "./BulkPublishGate.js";

const BulkAction = ContentEntryListConfig.Browser.BulkAction;

/*
 * The bulk "Publish" is disabled while a selected entry may not be published. Rows whose review is
 * in progress or rejected cannot be selected (`CmsReviewTableRowMapperDecorator`); this covers the
 * rest: entries of a bound model with no approved review.
 */
export const CmsReviewBulkPublishAction = BulkAction.createDecorator(Original => {
    return function CmsReviewBulkPublishActionDecorator(props) {
        if (props.name !== "publish") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<BulkPublishGate>{props.element}</BulkPublishGate>} />;
    };
});
