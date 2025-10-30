import React, { useCallback } from "react";
import { WorkflowEditorSteps } from "./WorkflowEditorSteps.js";
import type { IWorkflowsPresenter } from "~/Presenters/index.js";
import { Button, Grid, Heading, Loader } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { WorkflowError } from "./Error/WorkflowError.js";

interface WorkflowViewProps {
    presenter: IWorkflowsPresenter;
}

export const WorkflowEditorView = observer((props: WorkflowViewProps) => {
    const { presenter } = props;

    const saveWorkflow = useCallback(() => {
        if (!presenter.vm.workflow || !presenter.vm.dirty) {
            return;
        } else if (presenter.vm.workflow.steps?.length > 0) {
            presenter.updateWorkflow(presenter.vm.workflow);
            return;
        }
        presenter.deleteWorkflow(presenter.vm.workflow);
    }, [presenter.vm.workflow]);

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
            <Heading level={6}>Steps</Heading>
            <Grid.Column span={12}>
                <Heading level={2}>{presenter.vm.app.name}</Heading>
            </Grid.Column>
            <Grid.Column span={12}>
                <WorkflowEditorSteps presenter={presenter} />
            </Grid.Column>
            <Grid.Column span={12} className={"text-right"}>
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
