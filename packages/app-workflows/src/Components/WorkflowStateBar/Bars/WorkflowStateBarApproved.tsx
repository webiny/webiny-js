/**
 * When state is approved.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";
import { WorkflowStateValue } from "~/types.js";

export const WorkflowStateBarApproved = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarApprovedDecorator(props) {
        const { presenter } = props;

        if (presenter.vm.state?.state !== WorkflowStateValue.approved) {
            return <Original {...props} />;
        }

        return <Alert>This entry was approved.</Alert>;
    });
});
