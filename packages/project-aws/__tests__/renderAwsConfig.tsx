import React from "react";
import { renderExtensions } from "@webiny/project/services/GetProjectConfigService/renderExtensions.js";
import type { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";
// Registering the implementations makes the specs of `@webiny/project-extensions-aws` render this
// package's components, as `ProjectAws` does.
import "~/extensions/registerExtensionImplementations.js";

const sdkParams = { env: "dev" } as unknown as ProjectSdkParamsService.Params;

/*
 * Renders a config the way `getProjectConfig` does in an AWS project, and returns the collected
 * properties. Set `WEBINY_HOSTING_TYPE=aws` first.
 */
export const renderAwsConfig = async (children: React.ReactNode) => {
    const Extensions = () => (
        <>
            {/* What `ProjectAws` renders before the project's own config. */}
            <DatabaseSetup setupName="ddb" />
            {children}
        </>
    );
    return (await renderExtensions({ Extensions, sdkParams })) as Record<string, any>;
};

/* The rendered properties as the project config model the Pulumi apps read. */
export const toProjectConfig = (config: Record<string, any>) => {
    return {
        extensionsByType: (type: string | { def: { type: string } }) => {
            const value = config[typeof type === "string" ? type : type.def.type];
            const instances = Array.isArray(value) ? value : value ? [value] : [];
            return instances.map(params => ({ params }));
        }
    } as unknown as IProjectConfigModel;
};

/* Sets `WEBINY_HOSTING_TYPE` for a test, and returns a function that puts it back. */
export const useHostingType = (hostingType: string) => {
    const original = process.env.WEBINY_HOSTING_TYPE;
    process.env.WEBINY_HOSTING_TYPE = hostingType;
    return () => {
        if (original === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = original;
        }
    };
};
