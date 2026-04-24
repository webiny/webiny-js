import React from "react";
import { ContentEntryEditorConfig, useContentEntry } from "@webiny/app-headless-cms";
import { Components } from "@webiny/app-workflows";
import { useSecurity } from "@webiny/app-admin";
import { useApolloClient } from "@apollo/react-hooks";
import { createAppName } from "~/utils/appName.js";

const {
    ContentReview: { WorkflowStateProvider }
} = Components;

const { ContentEntry } = ContentEntryEditorConfig;

export const ContentEntryWorkflow = ContentEntry.createDecorator(Original => {
    return function ContentEntryWorkflowSetup() {
        const { entry, contentModel: model } = useContentEntry();
        const client = useApolloClient();

        const { identity } = useSecurity();

        return (
            <WorkflowStateProvider
                app={createAppName(model)}
                id={entry.id}
                identity={identity}
                client={client}
                title={`${model.name}: ${entry.meta?.title || "unknown"}`}
            >
                <Original />
            </WorkflowStateProvider>
        );
    };
});
