/**
 * When state is approved.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";
import { WorkflowStateValue } from "~/types.js";

export const WorkflowStateBarRejected = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarRejectedDecorator(props) {
        const { presenter } = props;

        if (presenter.vm.state?.state === WorkflowStateValue.rejected) {
            return <Alert type="warning">This entry was rejected.</Alert>;
        }

        return <Original {...props} />;
    });
});
