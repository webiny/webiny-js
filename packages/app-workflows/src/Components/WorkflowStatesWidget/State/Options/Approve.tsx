import React from "react";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IWorkflowStateRowOptionsApproveProps {
    state: IWorkflowStatesWidgetItem;
}

export const WorkflowStateRowOptionsApprove = ({ state }: IWorkflowStateRowOptionsApproveProps) => {
    if (state.state !== "inReview" || !state.step.isAllowedToReview) {
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
