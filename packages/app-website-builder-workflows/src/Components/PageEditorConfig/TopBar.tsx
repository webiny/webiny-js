import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { WorkflowStateBar } from "~/Components/PageEditorConfig/WorkflowStateBar.js";

const { Ui } = PageEditorConfig;

export const TopBar = Ui.TopBar.Layout.createDecorator(Original => {
    return function TopBarWorkflowsState() {
        return (
            <>
                <Original />
                <WorkflowStateBar />
            </>
        );
    };
});
