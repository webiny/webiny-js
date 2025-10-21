import React from "react";
import { ContentEntryForm, useContentEntry } from "@webiny/app-headless-cms";
import { WorkflowStateBar } from "@webiny/app-workflows";
import { Grid } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";
import { useApolloClient } from "@apollo/react-hooks";

export const ContentEntryFormWorkflow = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryFormWorkflow(props) {
        const { entry, contentModel: model } = useContentEntry();
        const client = useApolloClient();

        const { identity } = useSecurity();
        if (!entry?.id || !model?.modelId || !identity?.id) {
            return <Original {...props} />;
        }

        return (
            <Grid>
                <Grid.Column span={12}>
                    <WorkflowStateBar
                        app={`cms.${model.modelId}`}
                        id={entry.id}
                        identity={identity}
                        client={client}
                    />
                </Grid.Column>
                <Grid.Column span={12}>
                    <Original {...props} />
                </Grid.Column>
            </Grid>
        );
    };
});
