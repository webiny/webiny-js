import React from "react";
import { observer } from "mobx-react-lite";
import type { IWorkflowStateBarComponentProps } from "./WorkflowStateBarComponent.js";
import { WorkflowStateBarComponent } from "./WorkflowStateBarComponent.js";

export const WorkflowStateBarObserver = observer((props: IWorkflowStateBarComponentProps) => {
    return <WorkflowStateBarComponent {...props} />;
});
