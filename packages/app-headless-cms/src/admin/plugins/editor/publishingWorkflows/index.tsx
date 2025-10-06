import React from "react";
import type { CmsEditorFormSettingsPlugin, CmsModel } from "~/types.js";
import { WorkflowView } from "@webiny/app-workflows";
import { ReactComponent as WorkflowIcon } from "@webiny/icons/account_tree.svg";
import { useApolloClient } from "@apollo/react-hooks";

export const publishingWorkflowsEditorFormSettingsPlugin: CmsEditorFormSettingsPlugin<CmsModel> = {
    name: "cms-editor-form-settings-publishing-workflows",
    type: "cms-editor-form-settings",
    title: "Publishing Workflows",
    description: "Manage content model's Publishing Workflows.",
    icon: <WorkflowIcon />,
    render: ({ formData }) => {
        const client = useApolloClient();
        if (!formData.modelId) {
            return <></>;
        }

        return <WorkflowView app={`cms:${formData.modelId}`} client={client} />;
    }
};
