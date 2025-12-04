import React from "react";
import { PageEditorConfig as BaseConfig } from "@webiny/app-website-builder";
import { PageEditorAutoSave } from "./PageEditorAutoSave.js";
import { PageFormWorkflowStateTooltip } from "./PageFormWorkflowStateTooltip.js";
import { PageFormWorkflowStatePublishButton } from "./PageFormWorkflowStatePublishButton.js";
import { PageEditorLayout } from "./PageEditorLayout.js";

export const PageEditorConfig = () => {
    return (
        <>
            <PageEditorLayout />
            <BaseConfig>
                {/* Should remove autosave feature */}
                <PageEditorAutoSave />
                {/* Should add a button with list of steps and their states + comment button in each row */}
                <PageFormWorkflowStateTooltip />
                {/* should remove publish button from the form */}
                <PageFormWorkflowStatePublishButton />
            </BaseConfig>
        </>
    );
};
