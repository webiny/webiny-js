import React from "react";
import { Components } from "@webiny/app-workflows";
import { Alert, Grid } from "@webiny/admin-ui";
import type { IWorkflowState } from "@webiny/app-workflows/types.js";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

interface IStoreAlertProps {
    state: IWorkflowState | undefined | null;
}

const StoreAlert = ({ state }: IStoreAlertProps) => {
    if (!state) {
        return null;
    }
    return (
        <div className={"max-w-screen bg-white p-sm"}>
            <Grid className={"w-full"}>
                <Grid.Column span={12}>
                    <Alert className={"mb-md mt-md"} type="danger">
                        Any changes you do on the page will not be stored!
                    </Alert>
                </Grid.Column>
            </Grid>
        </div>
    );
};

export const PageFormWorkflowState = () => {
    return (
        <WorkflowStateBar>
            {({ state }) => {
                return <StoreAlert state={state} />;
            }}
        </WorkflowStateBar>
    );
};
