import React from "react";
import { useFeature } from "@webiny/app";
import { PageListConfig } from "@webiny/app-website-builder";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/flowchart.svg";
import { ReviewContentReviewsOverlaySidebarItem } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsOverlaySidebarItem.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewFeature } from "~/features/gateway/feature.js";

const { Browser } = PageListConfig;

const NAMESPACES = [WB_PAGE_APP];

// Opens the page reviews in an overlay over the pages list, as the trash bin does.
const ContentReviewsSidebarOverlay = () => {
    const { rowProvider } = useFeature(WbReviewFeature);

    return (
        <ReviewContentReviewsOverlaySidebarItem
            app={"wb"}
            rowProvider={rowProvider}
            namespaces={NAMESPACES}
            title={"Content Reviews - Pages"}
            icon={<ContentReviewsIcon />}
        />
    );
};

// The "Content Reviews" item of the page list sidebar; it opens the page reviews overlay.
export const WbContentReviewsSidebarItem = () => {
    return (
        <Browser.Sidebar.Footer
            name={"contentReviews"}
            element={<ContentReviewsSidebarOverlay />}
        />
    );
};
