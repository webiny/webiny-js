/**
 * When no workflow, we do not show the workflow state bar or do anything after this decorator.
 */
import React from "react";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarWorkflow = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarWorkflowDecorator(props) {
        const { presenter } = props;

        if (!presenter.vm.workflow) {
            return null;
        }
        return <Original {...props} />;
    });
});
