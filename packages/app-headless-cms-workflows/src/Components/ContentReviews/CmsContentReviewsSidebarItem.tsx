import React from "react";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/flowchart.svg";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ReviewContentReviewsSidebarItem } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsSidebarItem.js";
import { Routes } from "~/routes.js";

const { Browser } = ContentEntryListConfig;

const ContentReviewsSidebarLink = () => {
    return (
        <IsModelPublishable>
            <div className={"list-none"}>
                <ReviewContentReviewsSidebarItem
                    route={Routes.ContentEntries.ContentReviews}
                    icon={<ContentReviewsIcon />}
                />
            </div>
        </IsModelPublishable>
    );
};

// The "Content Reviews" item of the content entries sidebar; it opens the route (replaces the overlay).
export const CmsContentReviewsSidebarItem = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Sidebar.Footer
                name={"content-reviews"}
                element={<ContentReviewsSidebarLink />}
            />
        </ContentEntryListConfig>
    );
};
