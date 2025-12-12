import React from "react";
import { observer } from "mobx-react-lite";
import { Plugins } from "@webiny/app";
import { WorkflowStateBarError } from "./Bars/WorkflowStateBarError.js";
import { WorkflowStateBarLoading } from "./Bars/WorkflowStateBarLoading.js";
import { WorkflowStateBarRequestReview } from "./Bars/WorkflowStateBarRequestReview.js";
import { WorkflowStateBarCancelReview } from "./Bars/WorkflowStateBarCancelReview.js";
import { WorkflowStateBarReview } from "./Bars/WorkflowStateBarReview.js";
import { WorkflowStateBarApproved } from "./Bars/WorkflowStateBarApproved.js";
import { WorkflowStateBarRejected } from "./Bars/WorkflowStateBarRejected.js";
import { WorkflowStateBarWorkflow } from "./Bars/WorkflowStateBarWorkflow.js";
import { WorkflowStateBarComponent } from "./WorkflowStateBarComponent.js";
import { WorkflowStateBarStartReview } from "./Bars/WorkflowStateBarStartReview.js";
import { useWorkflowState } from "../useWorkflowState.js";
import { WorkflowStateBarDialogs } from "~/Components/WorkflowState/Bar/WorkflowStateBarDialogs.js";
import type { IWorkflow, IWorkflowState } from "~/types.js";

interface IWorkflowStateBarPropsChildrenParams {
    workflow: IWorkflow;
    state?: IWorkflowState | null;
}
interface IWorkflowStateBarPropsChildren {
    (
        params: IWorkflowStateBarPropsChildrenParams
    ): React.ReactElement | React.ReactElement[] | null;
}
export interface IWorkflowStateBarProps {
    /**
     * To have access to a state and workflow, render function is meant to be used.
     * It will rerender on every state change, and it will provide the latest state and workflow.
     *
     * Also, this way we avoid using MobX in the consumers of this component.
     */
    children?: IWorkflowStateBarPropsChildren | React.ReactElement | React.ReactElement[] | null;
}

export const WorkflowStateBar = observer((props: IWorkflowStateBarProps) => {
    const { presenter } = useWorkflowState();
    /**
     * If no workflow, do not show anything - there might not be a workflow assigned.
     * We do not want to show loading or error states in this case.
     */
    if (!presenter.vm.workflow) {
        return null;
    }

    return (
        <>
            <WorkflowStateBarDialogs />
            <Plugins>
                <WorkflowStateBarApproved />
                <WorkflowStateBarRejected />
                <WorkflowStateBarReview />
                <WorkflowStateBarStartReview />
                <WorkflowStateBarCancelReview />
                <WorkflowStateBarRequestReview />
                <WorkflowStateBarLoading />
                <WorkflowStateBarWorkflow />
                <WorkflowStateBarError />
            </Plugins>
            <WorkflowStateBarComponent presenter={presenter} />
            {typeof props.children === "function"
                ? props.children({ state: presenter.vm.state, workflow: presenter.vm.workflow })
                : props.children}
        </>
    );
});
