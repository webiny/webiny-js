import React from "react";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import { Accordion } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { WorkflowStateRowOptions } from "./WorkflowStateRowOptions.js";
import { WorkflowStateRowDescription } from "../Row/WorkflowStateRowDescription.js";

interface IWorkflowStateRowProps {
    state: IWorkflowStatesWidgetItem;
}

export const WorkflowStateRow = observer((props: IWorkflowStateRowProps) => {
    const { state } = props;

    return (
        <Accordion.Item
            title={state.title}
            open={false}
            interactive={false}
            description={<WorkflowStateRowDescription state={state} />}
            colorMark={state.step.color}
            actions={<WorkflowStateRowOptions state={state} />}
        >
            <></>
        </Accordion.Item>
    );
});
