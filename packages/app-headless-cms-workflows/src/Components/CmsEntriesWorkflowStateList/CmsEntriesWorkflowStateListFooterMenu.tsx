import React from "react";
import { Components } from "@webiny/app-headless-cms";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as WorkflowStateListIcon } from "@webiny/icons/flowchart.svg";
import { Components as WorkflowsComponents } from "@webiny/app-workflows";
import { useContentEntries } from "@webiny/app-headless-cms/admin/views/contentEntries/hooks/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { createAppName } from "~/utils/appName.js";
import { useApolloClient } from "@apollo/client/react";

const {
    Overlay: { WorkflowStateListAppOverlay }
} = WorkflowsComponents;

const { Footer } = Components.Sidebar;

export const CmsEntriesWorkflowStateListFooterMenu = Footer.createDecorator(Original => {
    return function CmsEntriesWorkflowStateListFooterMenu(props) {
        const { contentModel: model } = useContentEntries();
        const client = useApolloClient();

        const app = createAppName(model);

        return (
            <Original {...props}>
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
            </Original>
        );
    };
});
