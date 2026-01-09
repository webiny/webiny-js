import { z } from "zod";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { type AppName } from "~/abstractions/types.js";

export type ExtensionTags = {
    [key: string]: string | undefined;
    appName?: AppName;
    runtimeContext?: "app-build" | "project" | "cli" | "pulumi";
};

export type ParamsSchemaDefinition = Record<string, z.ZodTypeAny>;

export type ParamsSchemaInfer<T extends ParamsSchemaDefinition | undefined> =
    T extends ParamsSchemaDefinition ? z.infer<z.ZodObject<T> & { [k: string]: any }> : never;

// Type for the new pattern: (z) => ({...})
export type ParamsSchemaFunction<TParamsSchema extends ParamsSchemaDefinition | undefined> = 
    (zod: typeof z) => TParamsSchema;

// Type for the old pattern: ({project}) => z.object({...})
export type ParamsSchemaContextFunction = (ctx: ExtensionInstanceModelContext) => z.ZodObject<any>;

export interface DefineExtensionParams<TParamsSchema extends ParamsSchemaDefinition | undefined> {
    type: string;
    tags: ExtensionTags;
    description?: string;
    multiple?: boolean;
    paramsSchema?: ParamsSchemaFunction<TParamsSchema> | ParamsSchemaContextFunction;
    build?: (
        params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any,
        ctx: ExtensionInstanceModelContext
    ) => Promise<void> | void;
    validate?: (params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any) => Promise<void> | void;
}
