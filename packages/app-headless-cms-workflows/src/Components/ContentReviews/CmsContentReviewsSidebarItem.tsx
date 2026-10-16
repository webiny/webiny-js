import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/flowchart.svg";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { Routes } from "~/routes.js";

const { Browser } = ContentEntryListConfig;

const ContentReviewsSidebarLink = () => {
    const { goToRoute } = useRouter();

    return (
        <IsModelPublishable>
            <div className={"list-none"}>
                <Sidebar.Item
                    onClick={() => goToRoute(Routes.ContentEntries.ContentReviews)}
                    text={"Content Reviews"}
                    icon={
                        <Sidebar.Item.Icon
                            element={<ContentReviewsIcon />}
                            label={"Content Reviews"}
                        />
                    }
                />
            </div>
        </IsModelPublishable>
    );
};

/** The "Content Reviews" item of the content entries sidebar; it opens the route (replaces the overlay). */
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
