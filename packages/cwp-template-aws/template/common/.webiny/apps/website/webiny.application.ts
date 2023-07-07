import { createWebsiteApp } from "@webiny/serverless-cms-aws";
import type { ConfigPlugin, WebsiteConfigPlugin } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infraPlugins = defaultExport() as Array<ConfigPlugin | WebsiteConfigPlugin>;

    const configPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === null);
    const websiteConfigPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === "website");

    if (configPlugins.length) {
        for (let i = 0; i < configPlugins.length; i++) {
            const configPlugin = configPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }

    if (websiteConfigPlugins.length) {
        for (let i = 0; i < websiteConfigPlugins.length; i++) {
            const configPlugin = websiteConfigPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createWebsiteApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
