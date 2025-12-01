import { z } from "zod";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { type AppName } from "~/abstractions/types.js";

export type ExtensionTags = {
    [key: string]: string | undefined;
    appName?: AppName;
    runtimeContext?: "app-build" | "project" | "cli" | "pulumi";
};

export interface DefineExtensionParams<TParamsSchema extends z.ZodTypeAny> {
    type: string;
    tags: ExtensionTags;
    description?: string;
    multiple?: boolean;
    paramsSchema?: TParamsSchema | ((ctx: ExtensionInstanceModelContext) => TParamsSchema);
    build?: (
        params: z.infer<TParamsSchema>,
        ctx: ExtensionInstanceModelContext
    ) => Promise<void> | void;
    validate?: (params: z.infer<TParamsSchema>) => Promise<void> | void;
}
