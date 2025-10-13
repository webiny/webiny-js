import React from "react";
import type { CmsEditorFormSettingsPlugin, CmsModel } from "~/types.js";
import { WorkflowPresenter } from "@webiny/app-workflows";
import { ReactComponent as WorkflowIcon } from "@webiny/icons/account_tree.svg";
import { Alert } from "@webiny/admin-ui";

export const publishingWorkflowsEditorFormSettingsPlugin: CmsEditorFormSettingsPlugin<CmsModel> = {
    name: "cms-editor-form-settings-publishing-workflows",
    type: "cms-editor-form-settings",
    title: "Publishing Workflows",
    showSave: false,
    description: "Manage content model's Publishing Workflows.",
    icon: <WorkflowIcon />,
    render: ({ formData }) => {
        if (!formData.modelId) {
            return <></>;
        }

        return (
            <WorkflowPresenter app={`cms:${formData.modelId}`}>
                <Alert type={"danger"} title={"You don't have access to Workflows."}>
                    Access denied! TBD
                </Alert>
            </WorkflowPresenter>
        );
    }
};
