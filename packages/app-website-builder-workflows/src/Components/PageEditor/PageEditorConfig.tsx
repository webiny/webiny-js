import React from "react";
import { PageEditorConfig as BaseConfig } from "@webiny/app-website-builder";
import { PageFormWorkflowStateTooltip } from "./PageFormWorkflowStateTooltip.js";
import { PageFormWorkflowStatePublishButton } from "./PageFormWorkflowStatePublishButton.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageEditorAutoSave } from "./PageEditorAutoSave.js";

export const PageEditorConfig = () => {
    return (
        <>
            {/* Toggle editor "readonly" mode, and add workflow alerts */}
            <PageEditorTopBar />
            <PageEditorLayout />
            <PageEditorAutoSave />
            <BaseConfig>
                {/* Should add a button with list of steps and their states + comment button in each row */}
                <PageFormWorkflowStateTooltip />
                {/* should remove publish button from the form */}
                <PageFormWorkflowStatePublishButton />
            </BaseConfig>
        </>
    );
};
