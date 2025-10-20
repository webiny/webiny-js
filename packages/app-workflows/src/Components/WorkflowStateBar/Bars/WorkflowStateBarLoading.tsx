/**
 * Any loading related to workflow states.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarLoading = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarLoadingDecorator(props) {
        const { presenter } = props;
        const { loading, state } = presenter.vm;
        /**
         * If loading is true and state is defined, we can safely assume that loading is in progress.
         */
        if (loading && state) {
            return <Alert>Loading...</Alert>;
        }
        /**
         * If it's loading and state is undefined, we should not show anything as it is a first load.
         */
        //
        else if (loading && state === undefined) {
            return null;
        }

        return <Original {...props} />;
    });
});
