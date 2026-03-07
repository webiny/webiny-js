import { type ExtensionTags } from "~/defineExtension/types.js";
import { type z } from "zod";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";

export interface ExtensionDefinitionModelParams<TParamsSchema extends z.ZodTypeAny> {
    type: string;
    tags?: ExtensionTags;
    description: string;
    array?: boolean;
    paramsSchema?: TParamsSchema | ((ctx: ExtensionInstanceModelContext) => TParamsSchema);

    build?(params: z.infer<TParamsSchema>, ctx: ExtensionInstanceModelContext): Promise<void> | void;

    validate?(params: z.infer<TParamsSchema>): Promise<void> | void;
}

export class ExtensionDefinitionModel<TParamsSchema extends z.ZodTypeAny> {
    type: string;
    description: string;
    tags: ExtensionTags;
    multiple?: boolean;
    paramsSchema?: TParamsSchema | ((ctx: ExtensionInstanceModelContext) => TParamsSchema);

    build?(params: z.infer<TParamsSchema>, ctx: ExtensionInstanceModelContext): Promise<void> | void;

    validate?(params: z.infer<TParamsSchema>): Promise<void> | void;

    constructor(params: ExtensionDefinitionModelParams<TParamsSchema>) {
        this.type = params.type;
        this.tags = params.tags || {};
        this.description = params.description;
        this.multiple = params.array;
        this.paramsSchema = params.paramsSchema;
        this.build = params.build;
        this.validate = params.validate;
    }
}
