/**
 * Any loading related to workflow states.
 */
import React from "react";
import { Alert, Loader } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarLoading = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarLoadingDecorator(props) {
        const { presenter } = props;

        if (!presenter.vm.loading) {
            return <Original {...props} />;
        }
        return (
            <Alert>
                <Loader size="sm" variant="accent" indeterminate={true} />
            </Alert>
        );
    });
});
