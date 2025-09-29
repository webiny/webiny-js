import React, { useMemo } from "react";
import type { FormAPI } from "@webiny/form";
import type { CmsModel, IWorkflow } from "@webiny/app-headless-cms-common/types/index.js";
import { PublishingWorkflow } from "./PublishingWorkflow.js";
import { WorkflowsRepository } from "../repositories/index.js";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/abstractions/WorkflowModel.js";
import { WorkflowsPresenter } from "../presenters/WorkflowsPresenter.js";
import { WorkflowsGateway } from "~/admin/plugins/editor/publishingWorkflows/gateways/index.js";

interface ViewProps {
    form: FormAPI<Pick<CmsModel, "settings">>;
}

const defaultWorkflow: IWorkflow = {
    id: "default",
    name: "Default Workflow",
    steps: []
};

export const View = (props: ViewProps) => {
    const { form } = props;

    const { repository, presenter } = useMemo(() => {
        const gateway = new WorkflowsGateway(form);
        const repository = new WorkflowsRepository({
            gateway
        });
        const presenter = new WorkflowsPresenter({
            repository
        });
        return {
            repository,
            presenter
        };
    }, []);

    const workflow = useMemo((): IWorkflowModel => {
        /**
         * For now, we always return the "default" workflow.
         */
        return repository.findOne(defaultWorkflow.id);
    }, [presenter]);
    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <>
            <PublishingWorkflow workflow={workflow} />
        </>
    );
};
