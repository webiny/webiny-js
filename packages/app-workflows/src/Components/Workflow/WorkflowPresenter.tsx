import React, { useMemo } from "react";
import type { IWorkflow, IWorkflowApplication, IWorkflowStep } from "~/types.js";
import { WorkflowsRepository } from "~/Repositories/index.js";
import { WorkflowsPresenter } from "~/Presenters/index.js";
import { WorkflowsGateway } from "~/Gateways/index.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import { mdbid } from "@webiny/utils/mdbid.js";
import { useApolloClient } from "@apollo/react-hooks";
import { WorkflowView } from "./WorkflowView.js";

export interface IWorkflowPresenterProps {
    app: IWorkflowApplication;
}

const createDefaultWorkflow = (options: Pick<IWorkflow, "app"> & Partial<IWorkflow>): IWorkflow => {
    return {
        id: mdbid(),
        name: "Default Workflow",
        steps: [] as unknown as NonEmptyArray<IWorkflowStep>,
        ...options
    };
};

export const WorkflowPresenter = (props: IWorkflowPresenterProps) => {
    const { app } = props;
    const client = useApolloClient();

    const presenter = useMemo(() => {
        const defaultWorkflow = createDefaultWorkflow({
            app: app.id
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
    }, [app]);

    return <WorkflowView presenter={presenter} />;
};
