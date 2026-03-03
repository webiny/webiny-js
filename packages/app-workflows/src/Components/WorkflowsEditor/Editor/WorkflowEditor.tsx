import React, { useMemo } from "react";
import type { IWorkflow, IWorkflowApplication, IWorkflowStep } from "~/types.js";
import { WorkflowNotificationTypesRepository, WorkflowsRepository } from "~/Repositories/index.js";
import { WorkflowsPresenter } from "~/Presenters/index.js";
import { WorkflowNotificationTypesGateway, WorkflowsGateway } from "~/Gateways/index.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import { mdbid } from "@webiny/utils/mdbid.js";
import { useApolloClient } from "@apollo/client/react";
import { WorkflowEditorView } from "./WorkflowEditorView.js";

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
        const workflowsGateway = new WorkflowsGateway({
            client
        });
        const workflowsRepository = new WorkflowsRepository({
            gateway: workflowsGateway
        });

        const notificationTypesGateway = new WorkflowNotificationTypesGateway({
            client
        });
        const notificationsRepository = new WorkflowNotificationTypesRepository({
            gateway: notificationTypesGateway
        });

        return new WorkflowsPresenter({
            app,
            workflowsRepository,
            notificationTypesRepository: notificationsRepository,
            defaultWorkflow
        });
    }, [app]);

    return <WorkflowEditorView presenter={presenter} />;
};
