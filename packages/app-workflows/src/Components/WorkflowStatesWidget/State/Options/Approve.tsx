import React from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IWorkflowStateRowOptionsApproveProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsApprove = ({ state }: IWorkflowStateRowOptionsApproveProps) => {
    if (state.state !== WorkflowStateValue.inReview || !state.currentStep.isAllowedToReview) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<ApproveIcon />} label={"Approve"} />}
            text={"Approve"}
            onClick={() => {
                console.log({
                    approving: state.id
                });
            }}
        />
    );
};
