import React from "react";
import { Plugins } from "@webiny/app";
import { PageFormWorkflowStateTooltip } from "./PageFormWorkflowStateTooltip.js";
import { PageFormWorkflowStatePublishButton } from "./PageFormWorkflowStatePublishButton.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";

export const PageEditorConfig = () => {
    return (
        <Plugins>
            {/* Toggle editor "readonly" mode, and add workflow alerts */}
            <PageEditorTopBar />
            {/* Should add a button with list of steps and their states + comment button in each row */}
            <PageFormWorkflowStateTooltip />
            {/* should remove publish button from the form */}
            <PageFormWorkflowStatePublishButton />
        </Plugins>
    );
};
