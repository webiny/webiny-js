import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { TopBar } from "./TopBar.js";

export const WorkflowsPageEditorConfig = () => {
    return (
        <PageEditorConfig>
            <TopBar />
        </PageEditorConfig>
    );
};
