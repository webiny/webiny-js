import React, { useCallback, useMemo } from "react";
import type { IWorkflow, IWorkflowStep } from "~/types.js";
import { Workflow } from "./Workflow.js";
import { WorkflowsRepository } from "../Repositories/index.js";
import { WorkflowsPresenter } from "../Presenters/index.js";
import { WorkflowsGateway } from "../Gateways/index.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import { mdbid } from "@webiny/utils/mdbid.js";
import { Button, Grid } from "@webiny/admin-ui";
import { useApolloClient } from "@apollo/react-hooks";

interface WorkflowViewProps {
    app: string;
}

const createDefaultWorkflow = (options: Pick<IWorkflow, "app"> & Partial<IWorkflow>): IWorkflow => {
    return {
        id: mdbid(),
        name: "Default Workflow",
        steps: [] as unknown as NonEmptyArray<IWorkflowStep>,
        ...options
    };
};

export const WorkflowView = (props: WorkflowViewProps) => {
    const { app } = props;
    const client = useApolloClient();

    const presenter = useMemo(() => {
        const defaultWorkflow = createDefaultWorkflow({
            app
        });
        const gateway = new WorkflowsGateway({
            app,
            client
        });
        const repository = new WorkflowsRepository({
            gateway,
            defaultWorkflow
        });
        repository.init();
        return new WorkflowsPresenter({
            repository
        });
    }, []);
    
    const saveWorkflow = useCallback(() => {
        presenter.updateWorkflow(presenter.vm.workflow);
    }, [presenter.vm.workflow]);
    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <Grid>
            <Grid.Column span={12}>
                <Workflow presenter={presenter} />
            </Grid.Column>
            <Grid.Column span={12}>
                <Button text={"Save"} variant={"primary"} onClick={saveWorkflow} />
            </Grid.Column>
        </Grid>
    );
};
