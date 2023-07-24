import { createApiApp } from "@webiny/serverless-cms-aws";
import type { Config, ApiConfig } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infras = defaultExport() as Array<Config | ApiConfig>;

    const configs = infras.filter(infra => infra.app === null);
    const apiConfigs = infras.filter(infra => infra.app === "api");

    if (configs.length) {
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }

    if (apiConfigs.length) {
        for (let i = 0; i < apiConfigs.length; i++) {
            const config = apiConfigs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }
} catch (ex) {
    // Do nothing.
}


export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
