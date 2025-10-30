import React, { useCallback } from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as DeclineIcon } from "@webiny/icons/do_not_disturb.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";

interface IWorkflowStateRowOptionsDeclineProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsDecline = ({ state }: IWorkflowStateRowOptionsDeclineProps) => {
    const { presenter } = useWorkflowStatesWidget();
    const onClick = useCallback(() => {
        presenter.declineState(state);
    }, [state.id]);
    
    if (state.state !== WorkflowStateValue.inReview || !state.currentStep.isAllowedToReview) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<DeclineIcon />} label={"Decline"} />}
            text={"Decline"}
            onClick={onClick}
        />
    );
};
