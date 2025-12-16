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

        const step = presenter.vm.step;
        if (presenter.vm.state?.state !== WorkflowStateValue.approved || !step) {
            return <Original {...props} />;
        }

        return (
            <Alert
                icon={null}
                swatchColor={step.color}
                actions={
                    <>
                        <Alert.Action text={"Remove Review Request"} onClick={presenter.cancel} />
                    </>
                }
            >
                This entry was approved.
            </Alert>
        );
    });
});
