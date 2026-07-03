import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { DeveloperMode } from "@webiny/app-admin";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";

export const WorkflowStateBarApproved = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarApprovedDecorator(props) {
        const { presenter } = props;

        const step = presenter.vm.step;
        if (!presenter.vm.isApproved || !step) {
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
