import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as WorkflowStateListIcon } from "@webiny/icons/flowchart.svg";
import { Components as WorkflowsComponents } from "@webiny/app-workflows";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { useContentEntriesPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { createAppName } from "~/utils/appName.js";

const {
    Overlay: { WorkflowStateListAppOverlay }
} = WorkflowsComponents;

const { Browser } = ContentEntryListConfig;

const ContentReviewsMenuItem = () => {
    const presenter = useContentEntriesPresenter();
    const client = useApolloClient();

    const model = presenter.vm.model;
    const app = createAppName(model);

    return (
        <IsModelPublishable>
            <WorkflowStateListAppOverlay client={client} app={app}>
                {({ showOverlay }) => {
                    return (
                        <div className={"list-none"}>
                            <Sidebar.Item
                                onClick={showOverlay}
                                text={"Content Reviews"}
                                icon={
                                    <Sidebar.Item.Icon
                                        element={<WorkflowStateListIcon />}
                                        label={"Content Reviews"}
                                    />
                                }
                            />
                        </div>
                    );
                }}
            </WorkflowStateListAppOverlay>
        </IsModelPublishable>
    );
};

export const CmsEntriesWorkflowStateListFooterMenu = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Sidebar.Footer name={"content-reviews"} element={<ContentReviewsMenuItem />} />
        </ContentEntryListConfig>
    );
};
