import { createCoreApp } from "@webiny/serverless-cms-aws";
import type { ConfigPlugin, CoreConfigPlugin } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infraPlugins = defaultExport() as Array<ConfigPlugin | CoreConfigPlugin>;

    const configPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === null);
    const coreConfigPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === "core");

    if (configPlugins.length) {
        for (let i = 0; i < configPlugins.length; i++) {
            const configPlugin = configPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }

    if (coreConfigPlugins.length) {
        for (let i = 0; i < coreConfigPlugins.length; i++) {
            const configPlugin = coreConfigPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
