import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { WbContentReviewsSidebarItem } from "~/Components/ContentReviews/WbContentReviewsSidebarItem.js";
import { PageListChangeStatus } from "./PageListChangeStatus.js";

export const PagesList = () => {
    return (
        <PageListConfig>
            {/* Add a Content Reviews item to the footer of the sidebar. */}
            <WbContentReviewsSidebarItem />
            {/* Decorate the Change Status action in row options to hide it for pages in certain workflow states */}
            <PageListChangeStatus />
        </PageListConfig>
    );
};
