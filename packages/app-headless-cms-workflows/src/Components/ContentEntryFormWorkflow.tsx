import React from "react";
import { ContentEntryForm, useContentEntry } from "@webiny/app-headless-cms";
import { WorkflowStateBar } from "@webiny/app-workflows";
import { Grid } from "@webiny/admin-ui";

export const ContentEntryFormWorkflow = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryFormWorkflow(props) {
        const { entry, contentModel: model } = useContentEntry();
        console.log({
            entry,
            entryId: entry?.id,
            model,
            using: "ContentEntryFormWorkflow"
        });
        if (!entry?.id) {
            return <Original {...props} />;
        }

        return (
            <Grid>
                <Grid.Column span={12}>
                    <div>doing</div>
                    <WorkflowStateBar app={`cms:${model.modelId}`} id={entry.id} />
                </Grid.Column>
                <Grid.Column span={12}>
                    <Original {...props} />
                </Grid.Column>
            </Grid>
        );
    };
});
