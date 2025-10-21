/**
 * Any error the GraphQL API returns related to workflow states.
 * The are some specific error codes that the UI can handle accordingly.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";
import { IWorkflowStateError } from "~/Gateways/index.js";

const shouldRenderOriginal = (error: IWorkflowStateError | null) => {
    if (!error?.code) {
        return true;
    }
    return ["WORKFLOW_STATE_NOT_FOUND"].includes(error.code);
};

export const WorkflowStateBarError = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarErrorDecorator(props) {
        const { presenter } = props;

        if (shouldRenderOriginal(presenter.vm.error)) {
            return <Original {...props} />;
        }

        return (
            <Alert type="danger">
                {presenter.vm.error?.message}
                <br />
                <br />
                For more information, please check the browser console.
            </Alert>
        );
    });
});
