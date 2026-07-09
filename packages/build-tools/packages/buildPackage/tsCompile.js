import { join, resolve } from "path";
import fs from "node:fs";
import merge from "lodash/merge.js";
import { replaceTscAliases } from "./tsAliasReplacer.js";
import { getTscBinaryPath } from "./typescript/getTscBinaryPath.js";
import { readTsConfig } from "./typescript/readTsConfig.js";
import { runTsc } from "./typescript/runTsc.js";
import { writeTempTsConfig } from "./typescript/writeTempTsConfig.js";

export const tsCompile = async ({ cwd = "", overrides, debug, outputDir, checkOnly = false }) => {
    const normalizedCwd = cwd || process.cwd();
    const tscPath = getTscBinaryPath();

    const originalConfigPath = join(normalizedCwd, "tsconfig.build.json");
    let tsConfigPath = originalConfigPath;
    let tempConfigPath = null;
    let resolvedOutDir = null;

    const hasOverrides = overrides?.tsConfig || outputDir;

    if (hasOverrides) {
        let config = readTsConfig(originalConfigPath);

        if (overrides?.tsConfig) {
            if (typeof overrides.tsConfig === "function") {
                config = overrides.tsConfig(config);
            } else {
                merge(config, overrides.tsConfig);
            }

            if (debug) {
                console.log(`"tsconfig.build.json" overridden. New config:`);
                console.log(config);
            }
        }

        if (outputDir) {
            config.compilerOptions = config.compilerOptions || {};
            config.compilerOptions.outDir = outputDir;
            config.compilerOptions.declarationDir = outputDir;
        }

        resolvedOutDir = config.compilerOptions?.outDir;
        tempConfigPath = writeTempTsConfig(normalizedCwd, config);
        tsConfigPath = tempConfigPath;
    }

    try {
        const args = ["-p", tsConfigPath];
        args.push("--tsBuildInfoFile", join(normalizedCwd, "tsconfig.build.tsbuildinfo"));

        if (checkOnly) {
            args.push("--noEmit");
        }

        runTsc(tscPath, args, normalizedCwd);
    } finally {
        if (tempConfigPath) {
            fs.rmSync(tempConfigPath, { force: true });
        }
    }

    if (!checkOnly) {
        const distDir = outputDir || resolveDistDir(normalizedCwd, originalConfigPath, resolvedOutDir);
        await replaceTscAliases({ distDir, cwd: normalizedCwd, debug });
    }
};

function resolveDistDir(cwd, configPath, overriddenOutDir) {
    if (overriddenOutDir) {
        return resolve(cwd, overriddenOutDir);
    }
    const config = readTsConfig(configPath);
    const outDir = config.compilerOptions?.outDir;
    if (outDir) {
        return resolve(cwd, outDir);
    }
    return join(cwd, "dist");
}
