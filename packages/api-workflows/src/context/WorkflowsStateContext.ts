import type { Context } from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    IWorkflowsStateContext,
    IWorkflowsStateContextListStatesParams,
    IWorkflowsStateContextListStatesResponse
} from "./abstractions/WorkflowsStateContext.js";
import type { IWorkflowStateTransformer } from "~/context/transformer/abstractions/WorkflowStateTransformer.js";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";

export interface IWorkflowsStateContextParams {
    context: Pick<Context, "cms" | "security" | "workflows">;
    model: CmsModel;
    transformer: IWorkflowStateTransformer;
}

export class WorkflowsStateContext implements IWorkflowsStateContext {
    private readonly context;
    private readonly model;
    private readonly transformer;

    public constructor(params: IWorkflowsStateContextParams) {
        this.context = params.context;
        this.model = params.model;
        this.transformer = params.transformer;
    }

    public async listStates(
        params: IWorkflowsStateContextListStatesParams
    ): Promise<IWorkflowsStateContextListStatesResponse> {
        const [items, meta] = await this.context.cms.listLatestEntries<Omit<IWorkflowStateRecord, "id">>(this.model, {
            limit: 50,
            sort: ["createdOn_DESC"],
            ...params
        });
        const records = items.map(item => this.transformer.fromCmsEntry(item));
        const workflowIds = Array.from(new Set(records.map(item => item.workflowId)));
        
        const workflows = await this.context.workflows.listWorkflows({
            where: {
            
            },
        })

        return {
            items: records,
            meta
        };
    }
}
