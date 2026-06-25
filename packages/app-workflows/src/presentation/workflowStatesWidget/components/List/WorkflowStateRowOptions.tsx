import React, { useCallback } from "react";
import type { IWorkflowState } from "~/types.js";
import { WorkflowStateOptions } from "~/presentation/shared/index.js";
import { observer } from "mobx-react-lite";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

interface IWorkflowStateRowOptionsProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptions = observer((props: IWorkflowStateRowOptionsProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();

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
            onStart={onStart}
            onTakeOver={onTakeOver}
            onApprove={onApprove}
            onReject={onReject}
        />
    );
});
