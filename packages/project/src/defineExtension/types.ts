import React from "react";
import { z } from "zod";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { type AppName } from "~/abstractions/types.js";
import { type ExtensionHosting } from "~/extensions/hosting/hostingType.js";

export type ExtensionTags = {
    [key: string]: string | undefined;
    appName?: AppName;
    runtimeContext?: "app-build" | "project" | "cli";
    hosting?: ExtensionHosting;
};

/*
 * The tags a definition passes to `defineExtension`. Unlike `ExtensionTags`, which also describes
 * the partial tag filters passed to `getProjectConfig`, `hosting` is required: the hosting type the
 * extension works in, or "all". Rendering it in a project of another hosting type throws, and a new
 * extension can't end up in every hosting type by leaving the tag out.
 */
export type ExtensionDefinitionTags = ExtensionTags & {
    hosting: ExtensionHosting;
};

export interface DefineExtensionParams<TParamsSchema extends z.ZodTypeAny> {
    type: string;
    tags: ExtensionDefinitionTags;
    description?: string;
    multiple?: boolean;
    paramsSchema?: TParamsSchema | ((ctx: ExtensionInstanceModelContext) => TParamsSchema);
    build?: (
        params: z.infer<TParamsSchema>,
        ctx: ExtensionInstanceModelContext
    ) => Promise<void> | void;
    validate?: (params: z.infer<TParamsSchema>) => Promise<void> | void;
    render?: (
        props: z.infer<TParamsSchema> & {
            remove?: boolean;
            before?: string;
            after?: string;
            name?: string;
        }
    ) => React.ReactNode;
}
