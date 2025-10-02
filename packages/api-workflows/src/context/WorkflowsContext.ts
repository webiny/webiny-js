import type {
    Context,
    IWorkflow,
    IWorkflowInput,
    IWorkflowsContext,
    IWorkflowsContextGetParams,
    IWorkflowsContextListParams
} from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowsTransformer } from "./transformer/index.js";
import { mdbid } from "@webiny/utils";
import { NotFoundError } from "@webiny/handler-graphql";

export interface IWorkflowsContextParams {
    context: Context;
    model: CmsModel;
    transformer: IWorkflowsTransformer;
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

    public async createWorkflow(app: string, input: IWorkflowInput): Promise<IWorkflow> {
        const id = mdbid();
        const values = this.transformer.toCmsEntry({
            ...input,
            app
        });

        await this.context.cms.createEntry(this.model, {
            id,
            ...values
        });

        return {
            ...values,
            id
        };
    }

    public async updateWorkflow(
        app: string,
        id: string,
        input: IWorkflowInput
    ): Promise<IWorkflow> {
        const workflow = await this.getWorkflow({
            app,
            id
        });
        if (!workflow) {
            throw new NotFoundError(`Workflow with id "${id}" was not found!`);
        }
        const values = this.transformer.toCmsEntry({
            ...input,
            app
        });
        await this.context.cms.updateEntry(this.model, id, values);

        return {
            ...values,
            id
        };
    }

    public async deleteWorkflow(app: string, id: string): Promise<boolean> {
        const workflow = await this.getWorkflow({
            app,
            id
        });
        if (!workflow) {
            throw new NotFoundError(`Workflow with id "${id}" was not found!`);
        }
        await this.context.cms.deleteEntry(this.model, id);
        return true;
    }

    public async getWorkflow(params: IWorkflowsContextGetParams): Promise<IWorkflow | null> {
        const entry = await this.context.cms.getEntry<Omit<IWorkflow, "id">>(this.model, {
            where: {
                id: params.id,
                app: params.app
            }
        });

        if (!entry) {
            return null;
        }
        return this.transformer.fromCmsEntry(entry);
    }

    public async listWorkflows(params: IWorkflowsContextListParams): Promise<IWorkflow[]> {
        const [entries] = await this.context.cms.listEntries<Omit<IWorkflow, "id">>(this.model, {
            where: {
                app: params.app
            },
            sort: ["createdOn_ASC"],
            limit: 10000
        });
        return entries.map(entry => this.transformer.fromCmsEntry(entry));
    }
}
