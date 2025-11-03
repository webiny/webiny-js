import React from "react";
import type { IWorkflowState } from "~/types.js";
import { Accordion } from "@webiny/admin-ui";
import { WorkflowStateRowOptions } from "./WorkflowStateRowOptions.js";
import { WorkflowStateRowDescription } from "../Row/WorkflowStateRowDescription.js";

interface IWorkflowStateRowProps {
    state: IWorkflowState;
}

export const WorkflowStateRow = (props: IWorkflowStateRowProps) => {
    const { state } = props;

    return (
        <Accordion.Item
            title={state.title}
            subtitle={<WorkflowStateRowDescription state={state} />}
            open={false}
            interactive={false}
            colorMark={state.currentStep.color}
            actions={<WorkflowStateRowOptions state={state} />}
        >
            <></>
        </Accordion.Item>
    );
};
