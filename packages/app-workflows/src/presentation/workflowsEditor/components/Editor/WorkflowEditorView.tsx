import React from "react";
import { WorkflowEditorSteps } from "./WorkflowEditorSteps.js";
import type { IWorkflowsEditorPresenter } from "~/presentation/workflowsEditor/abstractions.js";
import { Grid, Loader } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { WorkflowError } from "./Error/WorkflowError.js";

interface WorkflowViewProps {
    presenter: IWorkflowsEditorPresenter;
}

export const WorkflowEditorView = observer((props: WorkflowViewProps) => {
    const { presenter } = props;

    if (presenter.vm.loading) {
        return (
            <Loader
                className={"pt-lg"}
                size="md"
                variant="accent"
                indeterminate={true}
                text="Loading..."
            />
        );
    }
    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <Grid>
            <WorkflowError error={presenter.vm.error} />
            <Grid.Column span={12}>
                <WorkflowEditorSteps presenter={presenter} />
            </Grid.Column>
        </Grid>
    );
});
