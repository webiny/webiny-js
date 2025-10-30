import React, { useCallback } from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateRowOptionsRejectProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsReject = observer(
    ({ state }: IWorkflowStateRowOptionsRejectProps) => {
        const { presenter } = useWorkflowStatesWidget();
        const onClick = useCallback(() => {
            presenter.showRejectStateStepDialog(state);
        }, [state.id]);

        if (state.state !== WorkflowStateValue.inReview || !state.currentStep.isAllowedToReview) {
            return null;
        }
        return (
            <DropdownMenu.Item
                icon={<Icon icon={<RejectIcon />} label={"Reject"} />}
                text={"Reject"}
                onClick={onClick}
            />
        );
    }
);
