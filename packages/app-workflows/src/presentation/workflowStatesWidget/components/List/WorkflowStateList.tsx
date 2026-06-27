import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { WorkflowStateRow } from "./WorkflowStateRow.js";
import { WorkflowStateListEmpty } from "./WorkflowStateListEmpty.js";
import type { IWorkflowState } from "~/types.js";

interface IWorkflowStateListProps {
    states: IWorkflowState[];
}

export const WorkflowStateList = (props: IWorkflowStateListProps) => {
    const { states } = props;

    if (states.length === 0) {
        return <WorkflowStateListEmpty />;
    }

    return (
        <Accordion variant={"container"}>
            {states.map(state => {
                return <WorkflowStateRow key={`state-${state.id}`} state={state} />;
            })}
        </Accordion>
    );
};
