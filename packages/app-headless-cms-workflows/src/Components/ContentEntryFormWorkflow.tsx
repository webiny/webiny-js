import React from "react";
import { ContentEntryForm, useContentEntry } from "@webiny/app-headless-cms";
import { WorkflowStateBar } from "@webiny/app-workflows";
import { Grid } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";

export const ContentEntryFormWorkflow = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryFormWorkflow(props) {
        const { entry, contentModel: model } = useContentEntry();

        const { identity } = useSecurity();
        if (!entry?.id || !model?.modelId || !identity?.id) {
            return <Original {...props} />;
        }

        return (
            <Grid>
                <Grid.Column span={12}>
                    <WorkflowStateBar />
                </Grid.Column>
                <Grid.Column span={12}>
                    <Original {...props} />
                </Grid.Column>
            </Grid>
        );
    };
});
