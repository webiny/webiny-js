import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

const { ContentEntry } = ContentEntryEditorConfig;

/**
 * @deprecated This component is a no-op. Workflow state is now managed via the DI presenter.
 * The CMS decorator (ContentEntryFormPresenterWorkflowDecorator) handles init/dispose.
 */
export const ContentEntryWorkflow = ContentEntry.createDecorator(Original => {
    return function ContentEntryWorkflowSetup() {
        return <Original />;
    };
});
