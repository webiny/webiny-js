import React, { useCallback } from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateRowOptionsApproveProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsApprove = observer(
    ({ state }: IWorkflowStateRowOptionsApproveProps) => {
        const { presenter } = useWorkflowStatesWidget();

        const onClick = useCallback(() => {
            presenter.showApproveStateStepDialog(state);
        }, [state.id]);

        const step = state.currentStep;

        if (state.state !== WorkflowStateValue.inReview || !step.canReview || !step.isOwner) {
            return null;
        }
        return (
            <DropdownMenu.Item
                icon={<Icon icon={<ApproveIcon />} label={"Approve"} />}
                text={"Approve"}
                onClick={onClick}
            />
        );
    }
);
