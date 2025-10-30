import React from "react";
import type { IWorkflowState } from "~/types.js";
import { Accordion, DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { WorkflowStateRowOptionsOpenInNewWindow } from "./Options/OpenInNewWindow.js";
import { WorkflowStateRowOptionsApprove } from "./Options/Approve.js";
import { WorkflowStateRowOptionsReject } from "./Options/Reject.js";

interface IWorkflowStateRowOptionsProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptions = ({ state }: IWorkflowStateRowOptionsProps) => {
    return (
        <DropdownMenu
            trigger={
                <Accordion.Item.Action
                    icon={<Icon icon={<MoreVerticalIcon />} label={"Options"} />}
                />
            }
            align="start"
            side="bottom"
        >
            <WorkflowStateRowOptionsOpenInNewWindow state={state} />
            <WorkflowStateRowOptionsApprove state={state} />
            <WorkflowStateRowOptionsReject state={state} />
        </DropdownMenu>
    );
};
