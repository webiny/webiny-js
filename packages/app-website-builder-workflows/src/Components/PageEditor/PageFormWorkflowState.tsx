import React from "react";
import { Components } from "@webiny/app-workflows";
import { Alert } from "@webiny/admin-ui";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

export const PageFormWorkflowState = () => {
    return (
        <WorkflowStateBar>
            {({ state, stateBar }) => {
                return state ? (
                    <div className={"max-w-screen bg-white p-sm"}>
                        {stateBar}
                        <Alert className={"mb-md mt-md"} type="danger">
                            Any changes you do on the page will not be stored!
                        </Alert>
                    </div>
                ) : null;
            }}
        </WorkflowStateBar>
    );
};
