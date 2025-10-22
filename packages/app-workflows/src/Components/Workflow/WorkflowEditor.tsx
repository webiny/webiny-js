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

export const WorkflowEditor = (props: IWorkflowPresenterProps) => {
    const { app } = props;
    const client = useApolloClient();

    const presenter = useMemo(() => {
        const defaultWorkflow = createDefaultWorkflow({
            app: app.id
        });
        const gateway = new WorkflowsGateway({
            client
        });
        const repository = new WorkflowsRepository({
            gateway
        });
        const presenter = new WorkflowsPresenter({
            app,
            repository,
            defaultWorkflow
        });
        presenter.init();
        return presenter;
    }, [app]);

    return <WorkflowView presenter={presenter} />;
};
