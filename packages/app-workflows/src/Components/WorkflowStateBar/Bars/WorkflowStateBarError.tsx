import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarError = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarErrorDecorator(props) {
        const { presenter } = props;
        const { error, state } = presenter.vm;
        if (!error) {
            return <Original {...props} />;
        }
        /**
         * If there is an error, but it's a WORKFLOW_NOT_FOUND one + state does not exist, we should not show bar at all.
         */
        //
        else if (error.code === "WORKFLOW_NOT_FOUND" && !state) {
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
