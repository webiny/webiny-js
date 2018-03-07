import Git from "./git";
import logger from "./logger";

export default async config => {
    const git = config.git || new Git();
    const tagFormat = (() => {
        if (typeof config.tagFormat === "function") {
            return config.tagFormat;
        }

        if (typeof config.tagFormat === "string") {
            return () => config.tagFormat;
        }

        return pkg => pkg.name + "@v${version}";
    })();

    const params = {
        logger: config.logger || logger(),
        git,
        config: {
            ci: typeof config.ci !== "undefined" ? config.ci : true,
            preview: typeof config.preview !== "undefined" ? config.preview : false,
            repositoryUrl: config.repositoryUrl || (await git.repoUrl()),
            branch: config.branch || "master",
            tagFormat
        }
    };

    // Load preset
    let { preset } = config;
    if (!preset || preset === "default") {
        preset = "./../presets/default";
    }
    const presetExports = await import(preset);

    // Load plugins
    let plugins = config.plugins;
    if (!plugins && presetExports.plugins) {
        plugins = await presetExports.plugins();
    }

    // Load packages
    if (!config.packages && presetExports.packages) {
        params.packages = await presetExports.packages();
    }

    if (config.packages) {
        params.packages = Array.isArray(config.packages) ? config.packages : [config.packages];
    }

    if (!Array.isArray(params.packages) || !params.packages.length) {
        throw new Error(`ENOPACKAGES: missing packages to process.`);
    }

    // Verify packages data structure
    params.packages.map(pkg => {
        if (
            !pkg.hasOwnProperty("name") ||
            !pkg.hasOwnProperty("packageJSON") ||
            !pkg.hasOwnProperty("location")
        ) {
            throw new Error(
                `EINVALIDPACKAGE: Packages MUST contain \`name\`, \`location\` and \`packageJSON\` keys.`
            );
        }
    });

    return { params, plugins };
};
