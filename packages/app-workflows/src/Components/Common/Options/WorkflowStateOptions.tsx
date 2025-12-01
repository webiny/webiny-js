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
    onStart?: (state: IWorkflowState) => void;
    onTakeOver?: (state: IWorkflowState) => void;
    onApprove?: (state: IWorkflowState) => void;
    onReject?: (state: IWorkflowState) => void;
}

export const WorkflowStateOptions = (props: IWorkflowStateOptionsProps) => {
    const { state, onReject, onStart, onTakeOver, onApprove } = props;

    const startClick = useCallback(() => {
        if (!onStart) {
            return;
        }
        onStart(state);
    }, [state, onStart]);

    const takeOverClick = useCallback(() => {
        if (!onTakeOver) {
            return;
        }
        onTakeOver(state);
    }, [state, onTakeOver]);

    const approveClick = useCallback(() => {
        if (!onApprove) {
            return;
        }
        onApprove(state);
    }, [state, onApprove]);

    const rejectClick = useCallback(() => {
        if (!onReject) {
            return;
        }
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
            <WorkflowStateOptionsOpenInNewWindow state={state} />
            {onStart ? <WorkflowStateOptionsStart onClick={startClick} state={state} /> : null}
            {onTakeOver ? (
                <WorkflowStateOptionsTakeOver onClick={takeOverClick} state={state} />
            ) : null}
            {onApprove ? (
                <WorkflowStateOptionsApprove onClick={approveClick} state={state} />
            ) : null}
            {onReject ? <WorkflowStateOptionsReject onClick={rejectClick} state={state} /> : null}
        </DropdownMenu>
    );
};
