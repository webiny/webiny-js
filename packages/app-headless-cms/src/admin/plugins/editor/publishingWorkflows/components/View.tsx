import React, { useMemo } from "react";
import type { FormAPI } from "@webiny/form";
import type { CmsModel, IWorkflow } from "~/types.js";
import { PublishingWorkflow } from "./PublishingWorkflow.js";
import { WorkflowsRepository } from "../repositories/index.js";
import { WorkflowsPresenter } from "../presenters/WorkflowsPresenter.js";
import { WorkflowsGateway } from "../gateways/index.js";

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
