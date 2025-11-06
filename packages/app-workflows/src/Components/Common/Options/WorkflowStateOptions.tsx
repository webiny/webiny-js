import React, { useCallback } from "react";
import { Accordion, DropdownMenu, Icon } from "@webiny/admin-ui";
import { WorkflowStateOptionsOpenInNewWindow } from "./OptionItem/OpenInNewWindow.js";
import { WorkflowStateOptionsStart } from "./OptionItem/Start.js";
import { WorkflowStateOptionsTakeOver } from "./OptionItem/TakeOver.js";
import { WorkflowStateOptionsApprove } from "./OptionItem/Approve.js";
import { WorkflowStateOptionsReject } from "./OptionItem/Reject.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import type { IWorkflowState } from "~/types.js";

interface IWorkflowStateOptionsProps {
    state: IWorkflowState;
    onOpenInNewWindow: (state: IWorkflowState) => void;
    onStart: (state: IWorkflowState) => void;
    onTakeOver: (state: IWorkflowState) => void;
    onApprove: (state: IWorkflowState) => void;
    onReject: (state: IWorkflowState) => void;
}

export const WorkflowStateOptions = (props: IWorkflowStateOptionsProps) => {
    const { state, onOpenInNewWindow, onReject, onStart, onTakeOver, onApprove } = props;

    const openInNewWindowOnClick = useCallback(() => {
        onOpenInNewWindow(state);
    }, [state, onOpenInNewWindow]);

    const startClick = useCallback(() => {
        onStart(state);
    }, [state, onStart]);

    const takeOverClick = useCallback(() => {
        onTakeOver(state);
    }, [state, onTakeOver]);

    const approveClick = useCallback(() => {
        onApprove(state);
    }, [state, onApprove]);

    const rejectClick = useCallback(() => {
        onReject(state);
    }, [state, onReject]);

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
            <WorkflowStateOptionsOpenInNewWindow onClick={openInNewWindowOnClick} />
            <WorkflowStateOptionsStart onClick={startClick} state={state} />
            <WorkflowStateOptionsTakeOver onClick={takeOverClick} state={state} />
            <WorkflowStateOptionsApprove onClick={approveClick} state={state} />
            <WorkflowStateOptionsReject onClick={rejectClick} state={state} />
        </DropdownMenu>
    );
};
