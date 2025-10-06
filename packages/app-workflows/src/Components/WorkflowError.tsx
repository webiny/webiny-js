import React from "react";
import type { IWorkflowError } from "~/Gateways/index.js";
import { Alert } from "@webiny/admin-ui";

interface IWorkflowErrorProps {
    error: IWorkflowError | null;
}

export const WorkflowError = (props: IWorkflowErrorProps) => {
    const { error } = props;
    if (!error) {
        return null;
    }

    return (
        <Alert type={"danger"} title={"An error occurred. Please check console for more info."}>
            <>{error.message}</>
        </Alert>
    );
};
