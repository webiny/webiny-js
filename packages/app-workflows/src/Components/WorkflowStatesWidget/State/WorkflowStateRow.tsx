import React from "react";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import { Accordion, TimeAgo } from "@webiny/admin-ui";
import { Color } from "~/Components/Workflows/Step/Color.js";
import { WorkflowStateRowOptions } from "~/Components/WorkflowStatesWidget/State/WorkflowStateRowOptions.js";

interface IWorkflowStateRowProps {
    state: IWorkflowStatesWidgetItem;
}

export const WorkflowStateRow = (props: IWorkflowStateRowProps) => {
    const { state } = props;

    return (
        <Accordion.Item
            disabled={true}
            key={`state-${state.id}`}
            title={state.title}
            description={
                <>
                    {state.currentStep.title} - {state.currentStep.savedBy?.displayName}
                    , <TimeAgo datetime={state.savedOn} />
                </>
            }
            icon={<Color color={state.currentStep.color} />}
            interactive={false}
            actions={<WorkflowStateRowOptions state={state} />}
        >
            <></>
        </Accordion.Item>
    );
};
