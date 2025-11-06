import { WorkflowStateOptions } from "~/Components/Common/index.js";
import type { IWorkflowState } from "~/types.js";
import React, { useCallback } from "react";
import { useWorkflowStateList } from "~/Components/WorkflowStateList/hooks/index.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateOptionsProps {
    state: IWorkflowState;
}

export const WorkflowStateListOptions = observer((props: IWorkflowStateOptionsProps) => {
    const { state } = props;

    const { presenter } = useWorkflowStateList();

    const onStart = useCallback(() => {
        // presenter.showStartStateStepDialog(state);
    }, [presenter, state]);

    const onTakeOver = useCallback(() => {
        // presenter.showTakeOverStateStepDialog(state);
    }, [presenter, state]);

    const onApprove = useCallback(() => {
        // presenter.showApproveStateStepDialog(state);
    }, [presenter, state]);

    const onReject = useCallback(() => {
        // presenter.showRejectStateStepDialog(state);
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
