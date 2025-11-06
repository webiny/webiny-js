import React, { useCallback } from "react";
import type { IWorkflowState } from "~/types.js";
import { WorkflowStateOptions } from "~/Components/Common/index.js";
import { observer } from "mobx-react-lite";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";

interface IWorkflowStateRowOptionsProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptions = observer((props: IWorkflowStateRowOptionsProps) => {
    const { state } = props;

    const { presenter } = useWorkflowStatesWidget();

    const onOpenInNewWindow = useCallback(() => {
        // todo
    }, [state]);

    const onStart = useCallback(() => {
        presenter.showStartStateStepDialog(state);
    }, [presenter, state]);

    const onTakeOver = useCallback(() => {
        presenter.showTakeOverStateStepDialog(state);
    }, [presenter, state]);

    const onApprove = useCallback(() => {
        presenter.showApproveStateStepDialog(state);
    }, [presenter, state]);

    const onReject = useCallback(() => {
        presenter.showRejectStateStepDialog(state);
    }, [presenter, state]);

    return (
        <WorkflowStateOptions
            state={state}
            onOpenInNewWindow={onOpenInNewWindow}
            onStart={onStart}
            onTakeOver={onTakeOver}
            onApprove={onApprove}
            onReject={onReject}
        />
    );
});
