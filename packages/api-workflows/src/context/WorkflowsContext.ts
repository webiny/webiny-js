import type {
    Context,
    ICreateWorkflowInput,
    IUpdateWorkflowInput,
    IWorkflow,
    IWorkflowsContext,
    IWorkflowsContextGetParams,
    IWorkflowsContextListParams
} from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowsTransformer } from "./transformer/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import { createIdentifier } from "@webiny/utils";

export interface IWorkflowsContextParams {
    context: Pick<Context, "cms" | "security">;
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

    public async ensureAccess(): Promise<void> {
        const permissions = await this.context.security.getPermissions("workflows");
        if (permissions?.length) {
            return;
        }
        throw new NotAuthorizedError({
            message: "You have no access to workflows.",
            code: "WORKFLOWS_ACCESS_DENIED"
        });
    }

    public async createWorkflow(app: string, input: ICreateWorkflowInput): Promise<IWorkflow> {
        await this.ensureAccess();
        const values = this.transformer.toCmsEntry({
            ...input,
            app
        });

        return this.context.security.withoutAuthorization(async () => {
            await this.context.cms.createEntry(this.model, values);

            return values;
        });
    }

    public async updateWorkflow(
        app: string,
        id: string,
        input: IUpdateWorkflowInput
    ): Promise<IWorkflow> {
        await this.ensureAccess();
        const workflow = await this.getWorkflow({
            app,
            id
        });
        if (!workflow) {
            throw new NotFoundError(`Workflow in app "${app}" with id "${id}" was not found!`);
        }
        const values = this.transformer.toCmsEntry({
            ...input,
            id,
            app
        });
        const targetId = createIdentifier({
            id,
            version: 1
        });
        return this.context.security.withoutAuthorization(async () => {
            await this.context.cms.updateEntry(this.model, targetId, values);

            return {
                ...values,
                id
            };
        });
    }

    public async deleteWorkflow(app: string, id: string): Promise<boolean> {
        await this.ensureAccess();
        const workflow = await this.getWorkflow({
            app,
            id
        });
        if (!workflow) {
            throw new NotFoundError(`Workflow in app "${app}" with id "${id}" was not found!`);
        }
        const targetId = createIdentifier({
            id,
            version: 1
        });
        return this.context.security.withoutAuthorization(async () => {
            await this.context.cms.deleteEntry(this.model, targetId);
            return true;
        });
    }

    public async getWorkflow(params: IWorkflowsContextGetParams): Promise<IWorkflow | null> {
        try {
            const id = createIdentifier({
                id: params.id,
                version: 1
            });
            const entry = await this.context.cms.getEntryById<Omit<IWorkflow, "id">>(
                this.model,
                id
            );

            if (entry?.values?.app === params.app) {
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

    public async listWorkflows(params: IWorkflowsContextListParams): Promise<IWorkflow[]> {
        const [entries] = await this.context.cms.listLatestEntries<Omit<IWorkflow, "id">>(
            this.model,
            {
                where: {
                    app: params.app
                },
                sort: ["createdOn_ASC"],
                limit: 10000
            }
        );
        return entries.map(entry => {
            return this.transformer.fromCmsEntry(entry);
        });
    }
}
