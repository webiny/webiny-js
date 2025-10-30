import React, { useCallback } from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as DeclineIcon } from "@webiny/icons/do_not_disturb.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateRowOptionsDeclineProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsDecline = observer(
    ({ state }: IWorkflowStateRowOptionsDeclineProps) => {
        const { presenter } = useWorkflowStatesWidget();
        const onClick = useCallback(() => {
            presenter.showDeclineStateDialog(state);
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
    }
);
