import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { WorkflowStateRow } from "./WorkflowStateRow.js";
import type { IWorkflowState } from "~/types.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateListProps {
    states: IWorkflowState[];
}

export const WorkflowStateList = observer((props: IWorkflowStateListProps) => {
    const { states } = props;

    return (
        <Accordion variant={"container"}>
            {states.map(state => {
                return <WorkflowStateRow key={`state-${state.id}`} state={state} />;
            })}
        </Accordion>
    );
});
