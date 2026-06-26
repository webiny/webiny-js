import { Alert, makeDecoratable } from "@webiny/admin-ui";
import React from "react";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";
import { observer } from "mobx-react-lite";

export interface IWorkflowStateBarComponentProps {
    presenter: IWorkflowStatePresenter;
}

const debug = process.env.DEBUG === "true";
/**
 * Code should never reach this point, as all possible states should be handled by decorators.
 * This is just a fallback to help debugging.
 */
export const WorkflowStateBarComponent = makeDecoratable(
    "WorkflowStateBarComponent",
    observer((props: IWorkflowStateBarComponentProps) => {
        const { presenter } = props;

        if (presenter.vm.loading) {
            return <Alert>Loading...</Alert>;
        } else if (!debug) {
            return <Alert>Something went wrong, please contact the administrator.</Alert>;
        }

        return (
            <Alert>
                <div>Debugging info:</div>
                {JSON.stringify({
                    ...presenter.vm
                })}
            </Alert>
        );
    })
);
