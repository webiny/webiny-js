import { createCoreApp } from "@webiny/serverless-cms-aws";
import type { Config, CoreConfig } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infras = defaultExport() as Array<Config | CoreConfig>;

    const configs = infras.filter(infra => infra.app === null);
    const coreConfigs = infras.filter(infra => infra.app === "core");

    if (configs.length) {
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }

    if (coreConfigs.length) {
        for (let i = 0; i < coreConfigs.length; i++) {
            const config = coreConfigs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
