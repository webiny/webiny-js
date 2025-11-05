import React, { useCallback } from "react";
import { type IWorkflowState } from "~/types.js";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateRowOptionsTakeOverProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsTakeOver = observer(
    ({ state }: IWorkflowStateRowOptionsTakeOverProps) => {
        const { presenter } = useWorkflowStatesWidget();

        const onClick = useCallback(() => {
            presenter.showTakeOverStateStepDialog(state);
        }, [state.id]);

        if (!state.currentStep.canTakeOver) {
            return null;
        }
        return (
            <DropdownMenu.Item
                icon={<Icon icon={<ApproveIcon />} label={"Take Over"} />}
                text={"Take Over"}
                onClick={onClick}
            />
        );
    }
);
