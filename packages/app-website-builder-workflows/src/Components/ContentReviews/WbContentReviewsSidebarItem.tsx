import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { PageListConfig } from "@webiny/app-website-builder";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/work_outline.svg";
import { Routes } from "~/routes.js";

const { Browser } = PageListConfig;

const ContentReviewsSidebarLink = () => {
    const { goToRoute } = useRouter();

    return (
        <Sidebar.Item
            className={"w-full"}
            onClick={() => goToRoute(Routes.Pages.WorkflowStateList)}
            text={"Content Reviews"}
            icon={<Sidebar.Item.Icon element={<ContentReviewsIcon />} label={"Content Reviews"} />}
        />
    );
};

/** The "Content Reviews" item of the page list sidebar; it opens the route (replaces the overlay). */
export const WbContentReviewsSidebarItem = () => {
    return (
        <Browser.Sidebar.Footer name={"contentReviews"} element={<ContentReviewsSidebarLink />} />
    );
};
