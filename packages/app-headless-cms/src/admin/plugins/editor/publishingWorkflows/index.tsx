import React from "react";
import type { CmsEditorFormSettingsPlugin } from "~/types.js";
import { View } from "./components/View.js";
import { ReactComponent as WorkflowIcon } from "@webiny/icons/account_tree.svg";

export const publishingWorkflowsEditorFormSettingsPlugin: CmsEditorFormSettingsPlugin = {
    name: "cms-editor-form-settings-publishing-workflows",
    type: "cms-editor-form-settings",
    title: "Publishing Workflows",
    description: "Manage content model's Publishing Workflows.",
    icon: <WorkflowIcon />,
    render({ form, formData }) {
        return <View form={form} formData={formData} />;
    }
};
