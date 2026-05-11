import { join } from "path";
import ts from "typescript";
import merge from "lodash/merge.js";
import { replaceTscAliases } from "./tsAliasReplacer.js";

export const tsCompile = async ({ cwd = "", overrides, debug, checkOnly = false }) => {
    // Normalize path separators to forward slashes for consistent behavior on Windows.
    const normalizedCwd = cwd.replace(/\\/g, "/");

    const tsConfigPath = join(normalizedCwd, "tsconfig.build.json");

    let { config: readTsConfig } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

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
    const parsedJsonConfigFile = ts.parseJsonConfigFileContent(readTsConfig, ts.sys, normalizedCwd);

    const { projectReferences, options, fileNames, errors } = parsedJsonConfigFile;

    const filteredFileNames = fileNames.filter(fileName => !fileName.endsWith(".d.ts"));

    if (checkOnly) {
        options.noEmit = true;
    }

    const program = ts.createProgram({
        projectReferences,
        options,
        rootNames: filteredFileNames,
        configFileParsingDiagnostics: errors
    });

    if (checkOnly) {
        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(errors);

        if (allDiagnostics.length) {
            const formatHost = {
                getCanonicalFileName: path => path,
                getCurrentDirectory: () => normalizedCwd,
                getNewLine: () => ts.sys.newLine
            };
            const message = ts.formatDiagnostics(allDiagnostics, formatHost);
            if (message) {
                throw { message };
            }
        }
        return;
    }

    const { diagnostics, emitSkipped } = program.emit(
        undefined, // targetSourceFile
        (fileName, data, writeByteOrderMark) => {
            // Only emit files within the current package directory.
            // Normalize path separators to handle Windows backslashes vs forward slashes.
            const normalizedFileName = fileName.replace(/\\/g, "/");
            const relativePath = normalizedFileName.replace(normalizedCwd, "");
            if (normalizedFileName.startsWith(normalizedCwd) && !relativePath.includes("../")) {
                ts.sys.writeFile(fileName, data, writeByteOrderMark);
            }
        }
    );

    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics, errors);

    if (allDiagnostics.length) {
        const formatHost = {
            getCanonicalFileName: path => path,
            getCurrentDirectory: () => normalizedCwd,
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
    const distDir = options.outDir || join(normalizedCwd, "dist");
    await replaceTscAliases({ distDir, cwd: normalizedCwd, debug });
};
