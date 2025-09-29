import type { IWorkflowsGateway } from "./abstraction/index.js";
import type { FormAPI } from "@webiny/form";
import type { CmsModel, IWorkflow } from "~/types.js";

export class WorkflowsGateway implements IWorkflowsGateway {
    private readonly form;

    public constructor(form: FormAPI<Pick<CmsModel, "settings">>) {
        this.form = form;
    }

    public storeWorkflows(workflows: IWorkflow[]) {
        this.form.setValue("settings.workflows", workflows);
    }

    public getWorkflows(): IWorkflow[] {
        return this.form.getValue("settings.workflows") || [];
    }
}
