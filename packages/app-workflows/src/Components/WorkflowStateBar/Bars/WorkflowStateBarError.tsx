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
        const { error, state } = presenter.vm;
        if (!error || shouldRenderOriginal(error)) {
            return <Original {...props} />;
        }
        /**
         * If there is an error, but it's a WORKFLOWS_NOT_FOUND one + state does not exist, we should not show bar at all,
         * as there are no workflows to be applied for this entry.
         */
        //
        else if (error.code === "WORKFLOWS_NOT_FOUND" && !state) {
            return null;
        }
        console.log(error);
        return (
            <Alert type="danger">
                {error.message}
                <br />
                <br />
                For more information, please check the browser console.
            </Alert>
        );
    });
});
