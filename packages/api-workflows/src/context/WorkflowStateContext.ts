import type { Context } from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowStateTransformer } from "~/context/transformer/abstractions/WorkflowStateTransformer.js";
import {
    type IWorkflowState,
    type IWorkflowStateRecord,
    WorkflowStateRecordState
} from "./abstractions/WorkflowState.js";
import { WorkflowState } from "./workflowState/WorkflowState.js";
import type {
    IWorkflowStateContext,
    IWorkflowStateContextListStatesParams,
    IWorkflowStateContextListStatesResponse,
    IWorkflowStateContextOnStateAfterCreate,
    IWorkflowStateContextOnStateAfterDelete,
    IWorkflowStateContextOnStateAfterUpdate
} from "./abstractions/WorkflowStateContext.js";
import { NullWorkflowState } from "./workflowState/NullWorkflowState.js";
import { WebinyError } from "@webiny/error";
import { parseIdentifier } from "@webiny/utils";
import { NotFoundError } from "@webiny/handler-graphql";
import { createIdentifier } from "@webiny/utils/createIdentifier.js";
import type { IWorkflowsContextListWhere } from "~/context/abstractions/WorkflowsContext.js";
import { createTopic } from "@webiny/pubsub";

export interface IWorkflowStateContextParams {
    context: Pick<Context, "cms" | "security" | "workflows" | "workflowState" | "adminUsers">;
    model: CmsModel;
    transformer: IWorkflowStateTransformer;
}

type ICreateWorkflowStateEntryInput = Omit<
    IWorkflowStateRecord,
    "id" | "savedBy" | "createdOn" | "savedOn" | "createdBy"
>;

type IUpdateWorkflowStateEntryInput = Omit<
    IWorkflowStateRecord,
    "id" | "savedBy" | "savedOn" | "createdOn" | "createdBy"
>;

export class WorkflowStateContext implements IWorkflowStateContext {
    private readonly context;
    private readonly model;
    private readonly transformer;
    public readonly onStateAfterCreate;
    public readonly onStateAfterUpdate;
    public readonly onStateAfterDelete;

    public constructor(params: IWorkflowStateContextParams) {
        this.context = params.context;
        this.model = params.model;
        this.transformer = params.transformer;

        this.onStateAfterCreate = createTopic<IWorkflowStateContextOnStateAfterCreate>();
        this.onStateAfterUpdate = createTopic<IWorkflowStateContextOnStateAfterUpdate>();
        this.onStateAfterDelete = createTopic<IWorkflowStateContextOnStateAfterDelete>();
    }

    public async getState(id: string): Promise<IWorkflowState> {
        const record = await this.fetchOne(id);
        if (!record) {
            throw new WebinyError(`Workflow state not found.`, "NOT_FOUND", {
                id
            });
        }

        const workflowId = createIdentifier({
            id: record.workflowId,
            version: 1
        });

        const { items: workflows } = await this.context.workflows.listWorkflows({
            where: {
                id: workflowId
            },
            limit: 1
        });

        return new WorkflowState({
            record,
            workflow: workflows?.[0] || null,
            context: this.context
        });
    }

    public async getTargetState(app: string, targetRevisionId: string): Promise<IWorkflowState> {
        const { version } = parseIdentifier(targetRevisionId);
        if (!version) {
            throw new WebinyError(
                "Cannot get a workflow state without version of a target record.",
                "VERSION_REQUIRED",
                {
                    app,
                    targetRevisionId,
                    version
                }
            );
        }

        const state = await this.fetchOneByTargetRevisionId(app, targetRevisionId);
        if (!state) {
            return new NullWorkflowState();
        }

        const workflowId = createIdentifier({
            id: state.workflowId,
            version: 1
        });

        const { items: workflows } = await this.context.workflows.listWorkflows({
            where: {
                id: workflowId
            },
            limit: 1
        });

        return new WorkflowState({
            context: this.context,
            workflow: workflows[0],
            record: state
        });
    }

    public async listStates(
        params?: IWorkflowStateContextListStatesParams
    ): Promise<IWorkflowStateContextListStatesResponse> {
        const { items, meta } = await this.fetchAll(params);
        const workflowIds = Array.from(new Set(items.map(item => item.workflowId)));

        const where: IWorkflowsContextListWhere = {};
        if (workflowIds.length) {
            where.id_in = workflowIds;
        }

        const { items: workflows } = await this.context.workflows.listWorkflows({
            where,
            limit: 10000
        });

        return {
            items: items.map(record => {
                return new WorkflowState({
                    context: this.context,
                    workflow: workflows.find(wf => wf.id === record.workflowId),
                    record
                });
            }),
            meta
        };
    }

    public async createState(app: string, targetRevisionId: string): Promise<IWorkflowState> {
        const { id: targetId, version } = parseIdentifier(targetRevisionId);
        if (!version) {
            throw new WebinyError(
                "Cannot create a workflow state without version of a target record.",
                "VERSION_REQUIRED",
                {
                    app,
                    targetRevisionId,
                    version
                }
            );
        }
        /**
         * It may be possible, at some point, to have multiple workflows for a single app.
         * We will need to find a way to select a workflow for the given target record.
         * Until then, we will throw an error if multiple workflows are found for the given app.
         */
        const { items: workflows, meta } = await this.context.workflows.listWorkflows({
            where: {
                app
            },
            limit: 1
        });
        const workflow = workflows[0];
        if (!workflow) {
            return new NullWorkflowState();
        } else if (meta.totalCount > 1) {
            throw new WebinyError(
                `Multiple workflows found for the given app.`,
                "WORKFLOW_STATE_ERROR",
                {
                    app,
                    targetRevisionId,
                    workflows,
                    meta
                }
            );
        }

        const entry: ICreateWorkflowStateEntryInput = {
            workflowId: workflow.id,
            comment: undefined,
            state: WorkflowStateRecordState.pending,
            app,
            targetId,
            targetRevisionId,
            steps: workflow.steps.map(step => {
                return {
                    id: step.id,
                    state: WorkflowStateRecordState.pending,
                    savedBy: null,
                    comment: null
                };
            })
        };

        return this.context.security.withoutAuthorization(async () => {
            const result = await this.context.cms.createEntry<ICreateWorkflowStateEntryInput>(
                this.model,
                entry
            );
            const record = this.transformer.fromCmsEntry(result);
            const state = new WorkflowState({
                context: this.context,
                workflow,
                record
            });
            try {
                await this.onStateAfterCreate.publish({
                    state
                });
            } catch (ex) {
                console.log(ex);
                // do nothing?
            }
            return state;
        });
    }

    public async updateState(
        id: string,
        input: Partial<Omit<IWorkflowStateRecord, "id">>
    ): Promise<IWorkflowState> {
        const originalRecord = await this.fetchOne(id);
        if (!originalRecord) {
            throw new WebinyError(`Workflow state not found.`, "NOT_FOUND", {
                id,
                input
            });
        }
        // @ts-expect-error
        delete originalRecord["id"];

        const entryValues = this.transformer.toCmsEntry({
            ...originalRecord,
            ...input
        });

        const workflow = await this.context.workflows.getWorkflow({
            app: originalRecord.app,
            id: originalRecord.workflowId
        });
        if (!workflow) {
            throw new WebinyError(
                `Workflow with ID "${input.workflowId}" was not found.`,
                "WORKFLOW_NOT_FOUND",
                {
                    workflowId: input.workflowId
                }
            );
        }
        const originalState = new WorkflowState({
            context: this.context,
            workflow,
            record: originalRecord
        });

        return await this.context.security.withoutAuthorization(async () => {
            const result = await this.context.cms.updateEntry<IUpdateWorkflowStateEntryInput>(
                this.model,
                id,
                entryValues
            );
            const record = this.transformer.fromCmsEntry(result);

            const state = new WorkflowState({
                context: this.context,
                workflow,
                record
            });

            try {
                await this.onStateAfterUpdate.publish({
                    state,
                    original: originalState
                });
            } catch (ex) {
                console.log(ex);
                // do nothing?
            }

            return state;
        });
    }

    public async deleteState(id: string): Promise<void> {
        const record = await this.fetchOne(id);
        if (!record) {
            throw new NotFoundError();
        }
        try {
            await this.context.security.withoutAuthorization(async () => {
                await this.context.cms.deleteEntry(this.model, id);
            });
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return;
            }
            throw ex;
        }
    }

    public async deleteTargetState(app: string, targetRevisionId: string): Promise<void> {
        const record = await this.fetchOneByTargetRevisionId(app, targetRevisionId);
        if (!record) {
            return;
        }
        try {
            await this.context.security.withoutAuthorization(async () => {
                await this.context.cms.deleteEntry(this.model, record.id);
            });
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return;
            }
            throw ex;
        }

        const workflow = await this.context.workflows.getWorkflow({
            app: record.app,
            id: record.workflowId
        });

        const state = new WorkflowState({
            context: this.context,
            workflow,
            record
        });

        try {
            await this.onStateAfterDelete.publish({
                state
            });
        } catch (ex) {
            console.log(ex);
            // do nothing?
        }
    }

    public async startStateStep(id: string): Promise<IWorkflowState> {
        const state = await this.getState(id);
        if (state instanceof NullWorkflowState) {
            throw new WebinyError(`Workflow state not found.`, "NOT_FOUND", {
                id
            });
        }
        await state.start();
        return state;
    }

    public async approveStateStep(id: string, comment?: string): Promise<IWorkflowState> {
        const state = await this.getState(id);
        if (state instanceof NullWorkflowState) {
            throw new WebinyError(`Workflow state not found.`, "NOT_FOUND", {
                id,
                comment
            });
        }
        await state.approve(comment);
        return state;
    }

    public async rejectStateStep(id: string, comment: string): Promise<IWorkflowState> {
        const state = await this.getState(id);
        if (state instanceof NullWorkflowState) {
            throw new WebinyError(`Workflow state not found.`, "NOT_FOUND", {
                id,
                comment
            });
        }
        await state.reject(comment);
        return state;
    }

    private async fetchOneByTargetRevisionId(
        app: string,
        targetRevisionId: string
    ): Promise<IWorkflowStateRecord | null> {
        const { items } = await this.fetchAll({
            where: {
                app,
                targetRevisionId
            },
            limit: 10000
        });
        /**
         * There cannot be more than one workflow. If there is, something is very wrong and all states, except one, must be deleted.
         */
        if (items.length === 0) {
            return null;
        } else if (items.length > 1) {
            throw new WebinyError(
                `Multiple workflow states found for the given app and target ID.`,
                "WORKFLOW_STATE_ERROR",
                {
                    app,
                    targetRevisionId,
                    items
                }
            );
        }
        return items[0] || null;
    }

    private async fetchOne(id: string) {
        try {
            const entry = await this.context.security.withoutAuthorization(async () => {
                return this.context.cms.getEntryById<Omit<IWorkflowStateRecord, "id">>(
                    this.model,
                    id
                );
            });
            return this.transformer.fromCmsEntry(entry);
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return null;
            }
            throw ex;
        }
    }

    private async fetchAll(params?: IWorkflowStateContextListStatesParams) {
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
        return {
            items: records,
            meta
        };
    }
}
