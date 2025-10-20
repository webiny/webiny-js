import React from "react";
import { Alert } from "@webiny/admin-ui";
import type { IWorkflowStateError } from "~/Gateways/index.js";

export interface IWorkflowStateBarErrorProps {
    error: IWorkflowStateError;
}

export const WorkflowStateBarError = (props: IWorkflowStateBarErrorProps) => {
    const { error } = props;
    console.log(error);
    return (
        <Alert type="danger">
            {error.message}
            <br />
            <br />
            For more information, please check the browser console.
        </Alert>
    );
};
