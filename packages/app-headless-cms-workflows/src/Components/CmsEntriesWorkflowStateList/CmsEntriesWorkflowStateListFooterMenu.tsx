import React from "react";
import { Components } from "@webiny/app-headless-cms";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as WorkflowStateListIcon } from "@webiny/icons/work.svg";
import { WorkflowStateListAppOverlay } from "@webiny/app-workflows";
import { useContentEntries } from "@webiny/app-headless-cms/admin/views/contentEntries/hooks/index.js";
import { createAppName } from "~/utils/appName.js";
import { useApolloClient } from "@apollo/react-hooks";

const { Footer } = Components.Sidebar;

interface IWorkflowStateListButtonProps {
    onClick: () => void;
}

export const WorkflowStateListButton = (props: IWorkflowStateListButtonProps) => {
    return (
        <div className={"list-none"}>
            <Sidebar.Item
                onClick={props.onClick}
                text={"Workflow States"}
                icon={
                    <Sidebar.Item.Icon
                        element={<WorkflowStateListIcon />}
                        label={"Workflow States"}
                    />
                }
            />
        </div>
    );
};

export const CmsEntriesWorkflowStateListFooterMenu = Footer.createDecorator(Original => {
    return function CmsEntriesWorkflowStateListFooterMenu(props) {
        const { contentModel: model } = useContentEntries();
        const client = useApolloClient();

        return (
            <Original {...props}>
                <WorkflowStateListAppOverlay client={client} app={createAppName(model)}>
                    {({ showOverlay }) => {
                        return <WorkflowStateListButton onClick={showOverlay} />;
                    }}
                </WorkflowStateListAppOverlay>
            </Original>
        );
    };
});
