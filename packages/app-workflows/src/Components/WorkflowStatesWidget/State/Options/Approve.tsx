import React, { useCallback } from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";

interface IWorkflowStateRowOptionsApproveProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsApprove = ({ state }: IWorkflowStateRowOptionsApproveProps) => {
    const { presenter } = useWorkflowStatesWidget();
    
    const onClick = useCallback(() => {
        presenter.approveState(state);
    }, [state.id]);
    
    if (state.state !== WorkflowStateValue.inReview || !state.currentStep.isAllowedToReview) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<ApproveIcon />} label={"Approve"} />}
            text={"Approve"}
            onClick={onClick}
        />
    );
};
