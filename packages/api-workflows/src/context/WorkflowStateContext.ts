import type { Context } from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowStateTransformer } from "~/context/transformer/abstractions/WorkflowStateTransformer.js";
import type { IWorkflowState, IWorkflowStateRecord } from "./abstractions/WorkflowState.js";
import { WorkflowState } from "./workflowState/WorkflowState.js";
import type {
    IWorkflowStateContext,
    IWorkflowStateContextListStatesParams,
    IWorkflowStateContextListStatesResponse
} from "./abstractions/WorkflowStateContext.js";
import { NullWorkflowState } from "./workflowState/NullWorkflowState.js";
import { WebinyError } from "@webiny/error";

export interface IWorkflowStateContextParams {
    context: Pick<Context, "cms" | "security" | "workflows" | "workflowState">;
    model: CmsModel;
    transformer: IWorkflowStateTransformer;
}

export class WorkflowStateContext implements IWorkflowStateContext {
    private readonly context;
    private readonly model;
    private readonly transformer;

    public constructor(params: IWorkflowStateContextParams) {
        this.context = params.context;
        this.model = params.model;
        this.transformer = params.transformer;
    }

    public async getState(app: string, id: string): Promise<IWorkflowState> {
        const { items: states } = await this.listStates({
            where: {
                app,
                targetId: id
            },
            limit: 2
        });
        if (!states.length) {
            return new NullWorkflowState();
        } else if (states.length > 1) {
            throw new WebinyError(
                `Multiple workflow states found for the given app and target ID.`,
                "WORKFLOW_STATE_ERROR",
                {
                    app,
                    id
                }
            );
        }
        return states[0];
    }

    public async listStates(
        params?: IWorkflowStateContextListStatesParams
    ): Promise<IWorkflowStateContextListStatesResponse> {
        const [items, meta] = await this.context.security.withoutAuthorization(async () => {
            return await this.context.cms.listLatestEntries<Omit<IWorkflowStateRecord, "id">>(
                this.model,
                {
                    limit: 50,
                    sort: ["createdOn_DESC"],
                    ...params,
                    where: {
                        ...params?.where
                    }
                }
            );
        });
        const records = items.map(item => this.transformer.fromCmsEntry(item));
        const workflowIds = Array.from(new Set(records.map(item => item.workflowId)));

        const { items: workflows } = await this.context.workflows.listWorkflows({
            where: {
                id_in: workflowIds
            },
            limit: 10000
        });

        return {
            items: records
                .map(record => {
                    const workflow = workflows.find(wf => wf.id === record.workflowId);
                    return new WorkflowState({
                        context: this.context,
                        workflow,
                        record
                    });
                })
                .filter(item => {
                    return !!item.workflow;
                }),
            meta
        };
    }

    public async updateState(id: string, input: Omit<IWorkflowStateRecord, "id">): Promise<void> {
        await this.context.security.withoutAuthorization(async () => {
            return this.context.cms.updateEntry<Omit<IWorkflowStateRecord, "id">>(
                this.model,
                id,
                input
            );
        });
    }
}
