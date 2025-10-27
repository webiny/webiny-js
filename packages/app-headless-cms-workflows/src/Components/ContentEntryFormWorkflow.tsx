import React from "react";
import { ContentEntryForm, useContentEntry } from "@webiny/app-headless-cms";
import { WorkflowStateBar, WorkflowStateOverlay } from "@webiny/app-workflows";
import { Grid } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";
import type { PersistEntry } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/ContentEntryFormProvider.js";

/**
 * To override storing of the entry when in workflow state.
 */
// @ts-expect-error
const emptyFunction: PersistEntry = async () => {
    return void 0;
};

export const ContentEntryFormWorkflow = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryFormWorkflow(props) {
        const { entry, contentModel: model } = useContentEntry();
        const { identity } = useSecurity();

        const showOriginal = !entry?.id || !model?.modelId || !identity?.id;

        if (showOriginal) {
            return <Original {...props} />;
        }

        return (
            <Grid>
                <Grid.Column span={12}>
                    <WorkflowStateBar />
                </Grid.Column>
                <Grid.Column span={12}>
                    <WorkflowStateOverlay>
                        {({ state }) => {
                            return (
                                <Original
                                    {...props}
                                    persistEntry={state ? emptyFunction : props.persistEntry}
                                />
                            );
                        }}
                    </WorkflowStateOverlay>
                </Grid.Column>
            </Grid>
        );
    };
});
