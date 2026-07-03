import React from "react";
import type { IWorkflowState } from "~/types.js";
import { Accordion } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { WorkflowStateRowOptions } from "./WorkflowStateRowOptions.js";
import { WorkflowStateRowDescription } from "../Row/WorkflowStateRowDescription.js";

interface IWorkflowStateRowProps {
    state: IWorkflowState;
}

export const WorkflowStateRow = observer((props: IWorkflowStateRowProps) => {
    const { state } = props;

    return (
        <Accordion.Item
            title={state.title}
            open={false}
            interactive={false}
            description={<WorkflowStateRowDescription state={state} />}
            colorMark={state.currentStep.color}
            actions={<WorkflowStateRowOptions state={state} />}
        >
            <></>
        </Accordion.Item>
    );
});
