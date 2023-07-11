import { createWebsiteApp } from "@webiny/serverless-cms-aws";
import type { Config, WebsiteConfig } from "@webiny/infra";
import * as path from "path";

// @ts-ignore No Typescript definitions available.
import { getProject } from "@webiny/cli/utils";

let paramsOverrides = {};

try {
    const defaultExport = require(path.join(getProject().root, "plugins", "infra")).default;

    const infras = defaultExport() as Array<Config | WebsiteConfig>;

    const configs = infras.filter(infra => infra.app === null);
    const websiteConfigs = infras.filter(infra => infra.app === "website");

    if (configs.length) {
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }

    if (websiteConfigs.length) {
        for (let i = 0; i < websiteConfigs.length; i++) {
            const config = websiteConfigs[i];
            paramsOverrides = { ...paramsOverrides, ...config.params };

        }
    }
} catch (ex) {
    // Do nothing.
}

export default createWebsiteApp({
    pulumiResourceNamePrefix: "wby-",
    ...paramsOverrides
});
