import React from "react";
import { z } from "zod";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { type AppName } from "~/abstractions/types.js";
import { type HostingType } from "~/extensions/hosting/hostingType.js";

export type ExtensionTags = {
    [key: string]: string | undefined;
    appName?: AppName;
    runtimeContext?: "app-build" | "project" | "cli" | "pulumi";
    // The only hosting type the extension works in. Rendering it in a project of another hosting
    // type throws. Left out for extensions that work in every hosting type.
    hosting?: HostingType;
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
    render?: (
        props: z.infer<TParamsSchema> & {
            remove?: boolean;
            before?: string;
            after?: string;
            name?: string;
        }
    ) => React.ReactNode;
}
