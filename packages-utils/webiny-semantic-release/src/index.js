#!/usr/bin/env node
import compose from "webiny-compose";
import logger from "./utils/logger";
import getRepository from "./utils/getRepository";
import verifyEnvironment from "./plugins/verifyEnvironment";

export default async config => {
    const params = {
        packages: config.packages,
        logger: logger(),
        config: {
            ci: config.ci || true,
            dryRun: config.dryRun || false,
            repositoryUrl: config.repositoryUrl || (await getRepository()),
            branch: config.branch || "master",
            tagFormat:
                typeof config.tagFormat === "function"
                    ? config.tagFormat
                    : pkg => pkg.name + "@v${version}"
        }
    };

    if (!config.plugins) {
        let { preset } = config;

        if (!preset || preset === "default") {
            preset = "./presets/default";
        }

        const { plugins } = await import(preset);
        config.plugins = plugins;
    }

    // Verify packages data structure
    params.packages.map(pkg => {
        if (
            !pkg.hasOwnProperty("name") ||
            !pkg.hasOwnProperty("packageJSON") ||
            !pkg.hasOwnProperty("location")
        ) {
            throw new Error(
                `Packages MUST contain \`name\`, \`location\` and \`packageJSON\` keys.`
            );
        }
    });

    return compose([verifyEnvironment(), ...config.plugins])(params);
};
