import type { IWorkflowState, IWorkflowStateManager } from "./abstractions/WorkflowStateManager.js";
import type { Context } from "~/types.js";
import { WorkflowState } from "~/context/workflowState/WorkflowState.js";
import { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowStateManagerParams {
    model: CmsModel;
    app: string;
    id: string;
    context: Pick<Context, "cms" | "security" | "workflows">;
}

export class WorkflowStateManager implements IWorkflowStateManager {
    private readonly app;
    private readonly id;
    private readonly model;
    private readonly context;

    public constructor(params: IWorkflowStateManagerParams) {
        this.model = params.model;
        this.app = params.app;
        this.id = params.id;
        this.context = params.context;
    }

    public async getState(): IWorkflowState {
        const states = await this.getRecordState({
            app: this.app,
            id: this.id
        });

        const workflow = await this.context.workflows.listWorkflows({
            app: this.app
        });
        return new WorkflowState({
            workflow,
            app: this.app,
            id: this.id
        });
    }
    setState: (state: IWorkflowState) => Promise<void>;
    deleteState: (id: string) => Promise<void>;
    public async listStates() {
        const states = await this.context.cms.listLatestEntries(this.model, {
            limit: 100,
        });
        
    }

    private async getRecordState(params: IGetRecordStateParams): Promise<void> {
        const { app, id } = params;
    }
}
