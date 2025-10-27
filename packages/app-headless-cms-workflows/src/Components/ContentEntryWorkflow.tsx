import React from "react";
import { ContentEntryEditorConfig, useContentEntry } from "@webiny/app-headless-cms";
import { WorkflowState } from "@webiny/app-workflows";
import { useSecurity } from "@webiny/app-security";
import { useApolloClient } from "@apollo/react-hooks";

const { ContentEntry } = ContentEntryEditorConfig;

export const ContentEntryWorkflow = ContentEntry.createDecorator(Original => {
    return function ContentEntryWorkflowSetup() {
        const { entry, contentModel: model } = useContentEntry();
        const client = useApolloClient();

        const { identity } = useSecurity();
        if (!entry?.id || !model?.modelId || !identity?.id) {
            return <Original />;
        }

        return (
            <WorkflowState
                app={`cms.${model.modelId}`}
                id={entry.id}
                identity={identity}
                client={client}
                title={`${model.name}: ${entry.meta.title}`}
            >
                <Original />
            </WorkflowState>
        );
    };
});
