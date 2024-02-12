import React from "react";
import { BindComponent } from "@webiny/form";
import { makeDecoratable } from "@webiny/app-admin";
import { ApwWorkflow } from "~/types";

export interface WorkflowScopeProps {
    Bind: BindComponent;
    workflow: ApwWorkflow;
}

export const WorkflowScope = makeDecoratable("WorkflowScope", (props: WorkflowScopeProps) => {
    const { workflow } = props;
    return (
        <div>
            There is no WorkflowScope for <strong>{workflow.app}</strong> application.
        </div>
    );
});
