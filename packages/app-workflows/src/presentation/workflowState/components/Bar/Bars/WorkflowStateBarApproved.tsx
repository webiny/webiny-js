/**
 * When state is approved.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";
import { DeveloperMode } from "@webiny/app-admin";
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
                    <DeveloperMode>
                        <Alert.Action text={"Remove Review Request"} onClick={presenter.cancel} />
                    </DeveloperMode>
                }
            >
                This entry was approved.
            </Alert>
        );
    });
});
