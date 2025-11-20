import React from "react";
import { WorkflowStateBar, WorkflowStateOverlay } from "@webiny/app-workflows";
import { Alert, Grid } from "@webiny/admin-ui";
import type { IWorkflowState } from "@webiny/app-workflows/types.js";

interface IStoreAlertProps {
    state: IWorkflowState | undefined;
}

const StoreAlert = ({ state }: IStoreAlertProps) => {
    if (!state) {
        return null;
    }
    return (
        <Alert className={"mb-md"} type="danger">
            Any changes you do on the page will not be stored!
        </Alert>
    );
};

export const PageFormWorkflow = () => {
    return (
        <Grid>
            <Grid.Column span={12}>
                <WorkflowStateBar />
            </Grid.Column>
            <Grid.Column span={12}>
                <WorkflowStateOverlay>
                    {({ state }) => {
                        return <StoreAlert state={state} />;
                    }}
                </WorkflowStateOverlay>
            </Grid.Column>
        </Grid>
    );
};
