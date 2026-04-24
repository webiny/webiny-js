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
                    <div className={"max-w-screen bg-white p-sm"} data-affects-preview={"height"}>
                        {stateBar}
                        {/*{state ? (
                            <Alert className={"mb-md mt-md"} type="danger">
                                Any changes you do on the page will not be stored!
                            </Alert>
                        ) : null}*/}
                    </div>
                );
            }}
        </WorkflowStateBar>
    );
};
