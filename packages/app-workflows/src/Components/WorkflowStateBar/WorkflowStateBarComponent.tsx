import { Alert, makeDecoratable } from "@webiny/admin-ui";
import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { observer } from "mobx-react-lite";

export interface IWorkflowStateBarComponentProps {
    presenter: IWorkflowStatePresenter;
}

/**
 * Code should never reach this point, as all possible states should be handled by decorators.
 * This is just a fallback to help debugging.
 */
export const WorkflowStateBarComponent = makeDecoratable(
    "WorkflowStateBarComponent",
    observer((props: IWorkflowStateBarComponentProps) => {
        const { presenter } = props;

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
