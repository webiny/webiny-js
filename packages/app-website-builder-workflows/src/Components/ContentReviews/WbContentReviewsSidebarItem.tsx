import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/flowchart.svg";
import { ReviewContentReviewsSidebarItem } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsSidebarItem.js";
import { Routes } from "~/routes.js";

const { Browser } = PageListConfig;

const ContentReviewsSidebarLink = () => {
    return (
        <ReviewContentReviewsSidebarItem
            className={"w-full"}
            route={Routes.Pages.WorkflowStateList}
            icon={<ContentReviewsIcon />}
        />
    );
};

// The "Content Reviews" item of the page list sidebar; it opens the route (replaces the overlay).
export const WbContentReviewsSidebarItem = () => {
    return (
        <Browser.Sidebar.Footer name={"contentReviews"} element={<ContentReviewsSidebarLink />} />
    );
};
