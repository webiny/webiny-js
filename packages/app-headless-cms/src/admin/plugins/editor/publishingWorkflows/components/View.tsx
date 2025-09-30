import React, { useMemo } from "react";
import type { FormAPI } from "@webiny/form";
import type {
    CmsModel,
    IWorkflow,
    IWorkflowStepTeam
} from "@webiny/app-headless-cms-common/types/index.js";
import { PublishingWorkflow } from "./PublishingWorkflow.js";
import { WorkflowsRepository } from "../repositories/index.js";
import { WorkflowsPresenter } from "../presenters/WorkflowsPresenter.js";
import { WorkflowsGateway } from "~/admin/plugins/editor/publishingWorkflows/gateways/index.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

interface ViewProps {
    form: FormAPI<Pick<CmsModel, "settings">>;
}

const defaultWorkflow: IWorkflow = {
    id: "default",
    name: "Default Workflow",
    steps: [
        {
            id: "id",
            title: "Testing",
            teams: [] as unknown as NonEmptyArray<IWorkflowStepTeam>,
            color: "blue",
            description: "A description",
            notifications: []
        }
    ]
};

export const View = (props: ViewProps) => {
    const { form } = props;

    const presenter = useMemo(() => {
        const gateway = new WorkflowsGateway({
            form,
            defaultWorkflow
        });
        const repository = new WorkflowsRepository({
            gateway
        });
        return new WorkflowsPresenter({
            repository
        });
    }, []);

    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <>
            <PublishingWorkflow presenter={presenter} />
        </>
    );
};
