import { join } from "path";
import ts from "typescript";
import merge from "lodash/merge.js";
import { replaceTscAliases } from "./tsAliasReplacer.js";

export const tsCompile = async ({ cwd = "", overrides, debug }) => {
    const tsConfigPath = join(cwd, "tsconfig.build.json");

    let { config: readTsConfig } = ts.readConfigFile(
        tsConfigPath,
        ts.sys.readFile
    );

    if (overrides.tsConfig) {
        if (typeof overrides.tsConfig === "function") {
            readTsConfig = overrides.tsConfig(readTsConfig);
        } else {
            merge(readTsConfig, overrides.tsConfig);
        }

        if (debug) {
            console.log(`"tsconfig.build.json" overridden. New config:`);
            console.log(readTsConfig);
        }
    }
    const parsedJsonConfigFile = ts.parseJsonConfigFileContent(readTsConfig, ts.sys, cwd);

    const { projectReferences, options, fileNames, errors } = parsedJsonConfigFile;

    const program = ts.createProgram({
        projectReferences,
        options,
        rootNames: fileNames,
        configFileParsingDiagnostics: errors
    });

    const { diagnostics, emitSkipped } = program.emit();

    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics, errors);

    if (allDiagnostics.length) {
        const formatHost = {
            getCanonicalFileName: path => path,
            getCurrentDirectory: () => cwd,
            getNewLine: () => ts.sys.newLine
        };
        const message = ts.formatDiagnostics(allDiagnostics, formatHost);
        if (message) {
            throw { message };
        }
    }

    if (emitSkipped) {
        throw { message: "TypeScript compilation failed." };
    }

    // Resolve ~ path aliases in .d.ts files
    const distDir = options.outDir || join(cwd, "dist");
    await replaceTscAliases({ distDir, cwd, debug });
};
