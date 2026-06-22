import React from "react";
import { Components } from "@webiny/app-workflows";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

export const PageFormWorkflowState = () => {
    return (
        <WorkflowStateBar>
            {({ stateBar }) => {
                return (
                    <div
                        className={"max-w-screen bg-neutral-base p-sm"}
                        data-affects-preview={"height"}
                    >
                        {stateBar}
                    </div>
                );
            }}
        </WorkflowStateBar>
    );
};
