import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { WbContentReviewsSidebarItem } from "~/Components/ContentReviews/WbContentReviewsSidebarItem.js";
import { PageListReviewGatedActions } from "./PageListReviewGatedActions.js";
import { PageListReviewMoveAction } from "./PageListReviewMoveAction.js";

export const PagesList = () => {
    return (
        <PageListConfig>
            {/* Add a Content Reviews item to the footer of the sidebar. */}
            <WbContentReviewsSidebarItem />
            {/* Hide the Change status and Schedule row actions for pages a review blocks. */}
            <PageListReviewGatedActions />
            {/* Disable the Move row action for pages in review. */}
            <PageListReviewMoveAction />
        </PageListConfig>
    );
};
