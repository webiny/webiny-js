import React from "react";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as DeclineIcon } from "@webiny/icons/do_not_disturb.svg";

interface IWorkflowStateRowOptionsDeclineProps {
    state: IWorkflowStatesWidgetItem;
}

export const WorkflowStateRowOptionsDecline = ({ state }: IWorkflowStateRowOptionsDeclineProps) => {
    if (state.state !== "inReview" || !state.step.isAllowedToReview) {
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
