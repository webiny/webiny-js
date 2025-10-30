import React, { useCallback } from "react";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/start.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateRowOptionsStartProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsStart = observer(
    ({ state }: IWorkflowStateRowOptionsStartProps) => {
        const { presenter } = useWorkflowStatesWidget();

        const onClick = useCallback(() => {
            presenter.startStateStep(state);
        }, [state.id]);

        if (state.state !== WorkflowStateValue.pending || !state.currentStep.isAllowedToReview) {
            return null;
        }
        return (
            <DropdownMenu.Item
                icon={<Icon icon={<StartIcon />} label={"Start"} />}
                text={"Start Step Rreview"}
                onClick={onClick}
            />
        );
    }
);
