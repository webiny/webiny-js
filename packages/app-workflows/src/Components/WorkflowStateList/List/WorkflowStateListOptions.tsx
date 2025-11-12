import { WorkflowStateOptions } from "~/Components/Common/index.js";
import type { IWorkflowState } from "~/types.js";
import React from "react";
import { observer } from "mobx-react-lite";

interface IWorkflowStateOptionsProps {
    state: IWorkflowState;
}

export const WorkflowStateListOptions = observer((props: IWorkflowStateOptionsProps) => {
    const { state } = props;

    return <WorkflowStateOptions state={state} />;
});
