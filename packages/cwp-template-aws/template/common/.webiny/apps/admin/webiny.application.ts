import { createAdminApp } from "@webiny/serverless-cms-aws";
import type { ConfigPlugin, AdminConfigPlugin } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infraPlugins = defaultExport() as Array<ConfigPlugin | AdminConfigPlugin>;

    const configPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === null);
    const adminConfigPlugins = infraPlugins.filter(infraPlugin => infraPlugin.app === "admin");

    if (configPlugins.length) {
        for (let i = 0; i < configPlugins.length; i++) {
            const configPlugin = configPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }

    if (adminConfigPlugins.length) {
        for (let i = 0; i < adminConfigPlugins.length; i++) {
            const configPlugin = adminConfigPlugins[i];
            paramsOverrides = { ...paramsOverrides, ...configPlugin.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createAdminApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
