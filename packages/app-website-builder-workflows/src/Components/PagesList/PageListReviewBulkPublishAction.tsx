import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageBulkPublishGate } from "./PageBulkPublishGate.js";

const { Browser } = PageListConfig;

/*
 * The bulk "Publish" is disabled while a selected page may not be published. Pages whose review is
 * in progress or rejected cannot be selected (`WbReviewTableRowMapperDecorator`); this covers the
 * rest: pages with no approved review while a workflow binds the pages.
 */
export const PageListReviewBulkPublishAction = Browser.BulkAction.createDecorator(Original => {
    return function PageListReviewBulkPublishActionDecorator(props) {
        if (props.name !== "publishPages") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<PageBulkPublishGate element={props.element} />} />;
    };
});
