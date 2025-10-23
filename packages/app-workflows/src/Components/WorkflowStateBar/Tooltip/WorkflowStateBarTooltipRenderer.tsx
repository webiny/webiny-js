import { observer } from "mobx-react-lite";
import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

export interface IWorkflowStateBarTooltipRendererChildrenParams {
    presenter: IWorkflowStatePresenter;
}

export interface IWorkflowStateBarTooltipRendererChildren {
    (params: IWorkflowStateBarTooltipRendererChildrenParams): React.ReactElement;
}

interface IWorkflowStateBarTooltipRendererProps {
    presenter: IWorkflowStatePresenter;
    children?: IWorkflowStateBarTooltipRendererChildren;
}

export const WorkflowStateBarTooltipRenderer = observer(
    (props: IWorkflowStateBarTooltipRendererProps) => {
        const { presenter } = props;
        return <>{presenter.vm.state?.id || "no state"}</>;
    }
);
