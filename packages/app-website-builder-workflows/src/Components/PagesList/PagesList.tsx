import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { WbContentReviewsSidebarItem } from "~/Components/ContentReviews/WbContentReviewsSidebarItem.js";
import { PageListReviewGatedActions } from "./PageListReviewGatedActions.js";
import { PageListReviewMoveAction } from "./PageListReviewMoveAction.js";
import { PageListReviewBulkPublishAction } from "./PageListReviewBulkPublishAction.js";

export const PagesList = () => {
    return (
        <PageListConfig>
            {/* Add a Content Reviews item to the footer of the sidebar. */}
            <WbContentReviewsSidebarItem />
            {/* Disable Publish and hide Schedule publish for pages the API would refuse to publish. */}
            <PageListReviewGatedActions />
            {/* Disable the Move row action for pages in review. */}
            <PageListReviewMoveAction />
            {/* Disable the bulk Publish while a selected page may not be published. */}
            <PageListReviewBulkPublishAction />
        </PageListConfig>
    );
};
