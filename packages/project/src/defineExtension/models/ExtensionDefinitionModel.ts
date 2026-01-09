import { type ExtensionTags, type ParamsSchemaDefinition, type ParamsSchemaInfer, type ParamsSchemaFunction, type ParamsSchemaContextFunction } from "~/defineExtension/types.js";

export interface ExtensionDefinitionModelParams<TParamsSchema extends ParamsSchemaDefinition | undefined> {
    type: string;
    tags?: ExtensionTags;
    description: string;
    array?: boolean;
    paramsSchema?: ParamsSchemaFunction<TParamsSchema> | ParamsSchemaContextFunction;

    build?(
        params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any,
        ctx: any
    ): Promise<void> | void;

    validate?(
        params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any
    ): Promise<void> | void;
}

export class ExtensionDefinitionModel<TParamsSchema extends ParamsSchemaDefinition | undefined> {
    type: string;
    description: string;
    tags: ExtensionTags;
    multiple?: boolean;
    paramsSchema?: ParamsSchemaFunction<TParamsSchema> | ParamsSchemaContextFunction;

    build?(
        params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any,
        ctx: any
    ): Promise<void> | void;

    validate?(
        params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any
    ): Promise<void> | void;

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
