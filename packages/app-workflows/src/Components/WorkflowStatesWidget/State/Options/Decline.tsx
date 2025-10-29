import React from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as DeclineIcon } from "@webiny/icons/do_not_disturb.svg";

interface IWorkflowStateRowOptionsDeclineProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsDecline = ({ state }: IWorkflowStateRowOptionsDeclineProps) => {
    if (state.state !== WorkflowStateValue.inReview || !state.currentStep.isAllowedToReview) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<DeclineIcon />} label={"Decline"} />}
            text={"Decline"}
            onClick={() => {
                console.log({
                    declining: state.id
                });
            }}
        />
    );
};
