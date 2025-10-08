import React from "react";
import type { IWorkflowError } from "~/Gateways/index.js";
import { Alert, Dialog, Grid } from "@webiny/admin-ui";
import { useToggler } from "@webiny/app-admin";
import { FormattedError } from "./FormattedError.js";

interface IWorkflowErrorProps {
    error: IWorkflowError | null;
}

export const WorkflowError = (props: IWorkflowErrorProps) => {
    const { error } = props;

    const { toggleOn, on, toggleOff } = useToggler();

    if (!error) {
        return null;
    }
    return (
        <>
            <Grid.Column span={12}>
                <Alert
                    type={"danger"}
                    title={"An error occurred. Please check console for more info."}
                    actions={<Alert.Action text="More" onClick={toggleOn} />}
                >
                    <>{error.message}</>
                </Alert>
            </Grid.Column>
            <Dialog
                open={on}
                title="An error occurred while saving the workflow."
                onClose={toggleOff}
                actions={
                    <>
                        <Dialog.ConfirmButton text="Close" onClick={toggleOff} />
                    </>
                }
                showCloseButton={true}
                dismissible={true}
            >
                <FormattedError error={error} />
            </Dialog>
        </>
    );
};
