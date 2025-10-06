import React, { useMemo } from "react";
import type { IWorkflow, IWorkflowStep } from "~/types.js";
import { Workflow } from "./Workflow.js";
import { WorkflowsRepository } from "../Repositories/index.js";
import { WorkflowsPresenter } from "../Presenters/index.js";
import { WorkflowsGateway } from "../Gateways/index.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import { mdbid } from "@webiny/utils/mdbid.js";
import type ApolloClient from "apollo-client";

interface WorkflowViewProps {
    app: string;
    client: ApolloClient<object>;
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
    const { app, client } = props;

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

    console.log({
        renderingWorkflowView: true,
        presenter
    });
    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <>
            <Workflow presenter={presenter} />
        </>
    );
};
