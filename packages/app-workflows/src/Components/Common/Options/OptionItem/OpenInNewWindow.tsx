import React from "react";
import { makeDecoratable } from "@webiny/admin-ui";
import type { IWorkflowState } from "~/types.js";

export interface IWorkflowStateOptionsOpenInNewWindowProps {
    state: IWorkflowState;
}

export const WorkflowStateOptionsOpenInNewWindow = makeDecoratable(
    "WorkflowStateOptionsOpenInNewWindow",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (props: IWorkflowStateOptionsOpenInNewWindowProps) => {
        return <>Implement your decoration of WorkflowStateOptionsOpenInNewWindow</>;
    }
);
