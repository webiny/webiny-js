import type { Context } from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import { createIdentifier } from "@webiny/utils";
import type {
    IStoreWorkflowInput,
    IWorkflowsContext,
    IWorkflowsContextGetParams,
    IWorkflowsContextListParams,
    IWorkflowsContextListResponse
} from "./abstractions/WorkflowsContext.js";
import type { IWorkflowsTransformer } from "./transformer/abstractions/WorkflowsTransformer.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

export interface IWorkflowsContextParams {
    context: Pick<Context, "cms" | "security">;
    model: CmsModel;
    transformer: IWorkflowsTransformer;
}

interface ICreateWorkflowParams {
    app: string;
    id: string;
    input: IStoreWorkflowInput;
}

interface IUpdateWorkflowParams {
    app: string;
    id: string;
    input: IStoreWorkflowInput;
}

export class WorkflowsContext implements IWorkflowsContext {
    private readonly context;
    private readonly model;
    private readonly transformer;

    public constructor(params: IWorkflowsContextParams) {
        this.context = params.context;
        this.model = params.model;
        this.transformer = params.transformer;
    }

    public async storeWorkflow(
        app: string,
        id: string,
        input: IStoreWorkflowInput
    ): Promise<IWorkflow> {
        await this.ensureManageAccess();

        const workflow = await this.getWorkflow({
            app,
            id
        });
        if (!workflow) {
            return await this.createWorkflow({
                app,
                id,
                input
            });
        }
        return await this.updateWorkflow({
            app,
            id,
            input
        });
    }

    public async deleteWorkflow(app: string, id: string): Promise<boolean> {
        await this.ensureManageAccess();
        const workflow = await this.getWorkflow({
            app,
            id
        });
        if (!workflow) {
            throw new NotFoundError(`Workflow in app "${app}" with id "${id}" was not found!`);
        }
        const workflowId = createIdentifier({
            id,
            version: 1
        });
        return this.context.security.withoutAuthorization(async () => {
            await this.context.cms.deleteEntry(this.model, workflowId);
            return true;
        });
    }

    public async getWorkflow(params: IWorkflowsContextGetParams): Promise<IWorkflow | null> {
        try {
            const id = createIdentifier({
                id: params.id,
                version: 1
            });
            const entry = await this.context.security.withoutAuthorization(async () => {
                return this.context.cms.getEntryById<Omit<IWorkflow, "id">>(this.model, id);
            });

            if (entry.values.app === params.app) {
                return this.transformer.fromCmsEntry(entry);
            }
        } catch (ex) {
            if (ex instanceof NotFoundError || ex.code === "NOT_FOUND") {
                return null;
            }
            throw ex;
        }
        return null;
    }

    public async listWorkflows(
        params: IWorkflowsContextListParams
    ): Promise<IWorkflowsContextListResponse> {
        return this.context.security.withoutAuthorization(async () => {
            const [items, meta] = await this.context.cms.listLatestEntries<Omit<IWorkflow, "id">>(
                this.model,
                {
                    sort: ["createdOn_ASC"],
                    limit: 100,
                    ...params,
                    where: {
                        ...params.where
                    }
                }
            );
            return {
                items: items.map(entry => {
                    return this.transformer.fromCmsEntry(entry);
                }),
                meta
            };
        });
    }

    private async ensureManageAccess(): Promise<void> {
        const permissions = await this.context.security.getPermissions("workflows");
        if (permissions?.length) {
            return;
        }
        throw new NotAuthorizedError({
            message: "You have no access to workflows.",
            code: "WORKFLOWS_ACCESS_DENIED"
        });
    }

    private async createWorkflow(params: ICreateWorkflowParams): Promise<IWorkflow> {
        const { app, input } = params;
        const { id } = parseIdentifier(params.id);
        const values = this.transformer.toCmsEntry({
            ...input,
            id,
            app
        });
        await this.context.security.withoutAuthorization(async () => {
            return await this.context.cms.createEntry(this.model, values);
        });

        return {
            ...values,
            id
        };
    }

    private async updateWorkflow(params: IUpdateWorkflowParams): Promise<IWorkflow> {
        const { app, id, input } = params;
        const values = this.transformer.toCmsEntry({
            ...input,
            id,
            app
        });
        const workflowId = createIdentifier({
            id,
            version: 1
        });
        await this.context.security.withoutAuthorization(async () => {
            await this.context.cms.updateEntry(this.model, workflowId, values);
        });

        return {
            ...values,
            id
        };
    }
}
