import React from "react";
import { type IWorkflowState } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IWorkflowStateOptionsTakeOverProps {
    state: IWorkflowState;
    onClick: () => void;
}

export const WorkflowStateOptionsTakeOver = (props: IWorkflowStateOptionsTakeOverProps) => {
    const { state, onClick } = props;

    if (!state.currentStep.canTakeOver) {
        return null;
    }
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<ApproveIcon />} size={"sm"} label={"Take Over"} />}
            text={"Take Over"}
            onClick={onClick}
        />
    );
};
