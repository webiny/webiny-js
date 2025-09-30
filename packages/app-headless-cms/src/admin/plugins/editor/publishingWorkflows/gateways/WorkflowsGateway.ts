import type { IWorkflowsGateway } from "./abstraction/index.js";
import type { FormAPI } from "@webiny/form";
import type { CmsModel, IWorkflow } from "~/types.js";
import { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/index.js";

export interface IWorkflowsGatewayParams {
    form: FormAPI<Pick<CmsModel, "settings">>;
    defaultWorkflow: IWorkflow;
}

export class WorkflowsGateway implements IWorkflowsGateway {
    private readonly form;
    private readonly defaultWorkflow;

    public constructor(params: IWorkflowsGatewayParams) {
        this.form = params.form;
        this.defaultWorkflow = params.defaultWorkflow;
    }

    public storeWorkflows(input: IWorkflowModel[]) {
        const workflows = input.map(workflow => {
            return workflow.toJS();
        });

        this.form.setValue("settings.workflows", workflows);
    }

    public getWorkflows(): IWorkflow[] {
        const workflows = this.form.getValue("settings.workflows");
        if (!workflows?.length) {
            return [this.defaultWorkflow];
        }
        return workflows;
    }
}
