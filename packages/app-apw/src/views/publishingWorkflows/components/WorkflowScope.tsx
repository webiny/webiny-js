import React from "react";
import { BindComponent } from "@webiny/form";
import { ApwWorkflow } from "~/types";
import { makeComposable } from "@webiny/app-admin";

export interface WorkflowScopeProps {
    Bind: BindComponent;
    workflow: ApwWorkflow;
}

export const WorkflowScope = makeComposable<WorkflowScopeProps>("WorkflowScope", props => {
    const { workflow } = props;
    return (
        <div>
            There is no WorkflowScope for <strong>{workflow.app}</strong> application.
        </div>
    );
});
