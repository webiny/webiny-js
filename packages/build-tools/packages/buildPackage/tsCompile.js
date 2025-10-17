import { join } from "path";
import ts from "ts-patch/compiler/typescript.js";
import merge from "lodash/merge.js";

export const tsCompile = ({ cwd = "", overrides, debug }) => {
    return new Promise((resolve, reject) => {
        let { config: readTsConfig } = ts.readConfigFile(
            join(cwd, "tsconfig.build.json"),
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
                return reject({ message });
            }
        }

        if (emitSkipped) {
            return reject({ message: "TypeScript compilation failed." });
        }

        resolve();
    });
};
