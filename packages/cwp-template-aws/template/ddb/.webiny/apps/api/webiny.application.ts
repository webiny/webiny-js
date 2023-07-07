import { createApiApp } from "@webiny/serverless-cms-aws";
import type { ConfigPlugin, ApiConfigPlugin } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infraPlugins = defaultExport() as Array<ConfigPlugin | ApiConfigPlugin>;

    const configPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === null);
    const apiConfigPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === "api");

    if (configPlugins.length) {
        for (let i = 0; i < configPlugins.length; i++) {
            const configPlugin = configPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }

    if (apiConfigPlugins.length) {
        for (let i = 0; i < apiConfigPlugins.length; i++) {
            const configPlugin = apiConfigPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
