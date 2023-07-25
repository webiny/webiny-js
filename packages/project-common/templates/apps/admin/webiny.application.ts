import { createAdminApp } from "@webiny/serverless-cms-aws";
import type { Config, AdminConfig } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infras = defaultExport() as Array<Config | AdminConfig>;

    const configs = infras.filter(infra => infra.app === null);
    const adminConfigs = infras.filter(infra => infra.app === "admin");

    if (configs.length) {
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }

    if (adminConfigs.length) {
        for (let i = 0; i < adminConfigs.length; i++) {
            const config = adminConfigs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createAdminApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
