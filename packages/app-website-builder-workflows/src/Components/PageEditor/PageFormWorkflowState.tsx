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
        <Alert className={"mb-md mt-md"} type="danger">
            Any changes you do on the page will not be stored!
        </Alert>
    );
};

export const PageFormWorkflowState = () => {
    return (
        <div className={"max-w-screen bg-white pt-sm pb-sm"}>
            <Grid className={"max-w-[960px] mx-auto"}>
                <Grid.Column span={12}>
                    <WorkflowStateBar>
                        {({ state }) => {
                            return <StoreAlert state={state} />;
                        }}
                    </WorkflowStateBar>
                </Grid.Column>
            </Grid>
        </div>
    );
};
