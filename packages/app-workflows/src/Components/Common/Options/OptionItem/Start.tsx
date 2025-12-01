import React from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/start.svg";

interface IWorkflowStateOptionsStartProps {
    state: IWorkflowState;
    onClick: () => void;
}

export const WorkflowStateOptionsStart = (props: IWorkflowStateOptionsStartProps) => {
    const { state, onClick } = props;

    if (state.state !== WorkflowStateValue.pending || !state.currentStep.canReview) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<StartIcon />} label={"Start"} />}
            text={"Start Step Review"}
            onClick={onClick}
        />
    );
};
