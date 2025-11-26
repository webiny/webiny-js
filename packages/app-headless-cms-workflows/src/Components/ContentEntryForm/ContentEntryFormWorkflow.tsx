import React from "react";
import { ContentEntryForm, useContentEntry } from "@webiny/app-headless-cms";
import { Components } from "@webiny/app-workflows";
import { Alert, Grid } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";
import type { PersistEntry } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/ContentEntryFormProvider.js";
import type { IWorkflowState } from "@webiny/app-workflows/types.js";

const {
    ContentReview: { WorkflowStateBar, WorkflowStateOverlay }
} = Components;

/**
 * To override storing of the entry when in workflow state.
 */
// @ts-expect-error
const emptyFunction: PersistEntry = async () => {
    return void 0;
};

interface IStoreAlertProps {
    state: IWorkflowState | undefined;
}

const StoreAlert = ({ state }: IStoreAlertProps) => {
    if (!state) {
        return null;
    }
    return (
        <Alert className={"mb-md"} type="danger">
            Any changes you do on the entry will not be stored!
        </Alert>
    );
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
                                <>
                                    <StoreAlert state={state} />
                                    <Original
                                        {...props}
                                        persistEntry={state ? emptyFunction : props.persistEntry}
                                    />
                                </>
                            );
                        }}
                    </WorkflowStateOverlay>
                </Grid.Column>
            </Grid>
        );
    };
});
