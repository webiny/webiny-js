import React from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";

interface IWorkflowStateOptionsRejectProps {
    state: IWorkflowState;
    onClick: () => void;
}

export const WorkflowStateOptionsReject = (props: IWorkflowStateOptionsRejectProps) => {
    const { state, onClick } = props;

    const step = state.currentStep;
    if (state.state !== WorkflowStateValue.inReview || !step.canReview || !step.isOwner) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<RejectIcon />} size={"sm"} label={"Reject"} />}
            text={"Reject"}
            onClick={onClick}
        />
    );
};
