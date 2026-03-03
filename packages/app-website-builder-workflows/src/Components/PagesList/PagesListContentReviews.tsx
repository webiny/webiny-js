import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { PageListConfig } from "@webiny/app-website-builder";
import { Components } from "@webiny/app-workflows";
import { useApolloClient } from "@apollo/client/react";
import { WB_PAGE_APP } from "~/constants.js";
import { ReactComponent as WorkflowStateListIcon } from "@webiny/icons/work_outline.svg";

const {
    Overlay: { WorkflowStateListAppOverlay }
} = Components;

const { Browser } = PageListConfig;

const PageListContentReviewsButton = () => {
    const client = useApolloClient();

    return (
        <WorkflowStateListAppOverlay client={client} app={WB_PAGE_APP}>
            {({ showOverlay }) => {
                return (
                    <Sidebar.Item
                        className={"w-full"}
                        onClick={showOverlay}
                        text={"Content Reviews"}
                        icon={
                            <Sidebar.Item.Icon
                                element={<WorkflowStateListIcon />}
                                label={"Content Reviews"}
                            />
                        }
                    />
                );
            }}
        </WorkflowStateListAppOverlay>
    );
};

export const PagesListContentReviews = () => {
    return (
        <Browser.Sidebar.Footer
            name={"contentReviews"}
            element={<PageListContentReviewsButton />}
        />
    );
};
