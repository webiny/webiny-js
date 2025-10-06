import React, { useCallback } from "react";
import { Workflow } from "./Workflow.js";
import type { IWorkflowsPresenter } from "../Presenters/index.js";
import { Button, Grid, Loader } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { WorkflowError } from "./WorkflowError.js";

interface WorkflowViewProps {
    presenter: IWorkflowsPresenter;
}


export const WorkflowView = observer((props: WorkflowViewProps) => {
    const { presenter } = props;

    const saveWorkflow = useCallback(() => {
        if (!presenter.vm.dirty) {
            return;
        }
        presenter.updateWorkflow(presenter.vm.workflow);
    }, [presenter.vm.workflow]);

    if (presenter.vm.loading) {
        return <Loader size="md" variant="accent" indeterminate={true} text="Loading..." />;
    }
    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <Grid>
            <WorkflowError error={presenter.vm.error} />
            <Grid.Column span={12}>
                <Workflow presenter={presenter} />
            </Grid.Column>
            <Grid.Column span={12}>
                <Button
                    disabled={!presenter.vm.dirty}
                    text={"Save"}
                    variant={"primary"}
                    onClick={saveWorkflow}
                />
            </Grid.Column>
        </Grid>
    );
});
