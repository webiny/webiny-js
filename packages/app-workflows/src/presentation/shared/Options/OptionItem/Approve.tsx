import React from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IWorkflowStateOptionsApproveProps {
    state: IWorkflowState;
    onClick: () => void;
}

export const WorkflowStateOptionsApprove = (props: IWorkflowStateOptionsApproveProps) => {
    const { state, onClick } = props;

    const step = state.currentStep;

    if (state.state !== WorkflowStateValue.inReview || !step.canReview || !step.isOwner) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<ApproveIcon />} label={"Approve"} size={"sm"} />}
            text={"Approve"}
            onClick={onClick}
        />
    );
};
