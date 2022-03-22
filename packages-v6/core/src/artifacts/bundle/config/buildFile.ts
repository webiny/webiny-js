import fs from "fs-extra";
import { join, extname, relative } from "path";
import { transformFileAsync } from "@babel/core";
import ts from "ttypescript";
import { ParsedCommandLine } from "typescript";

const BABEL_COMPILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

interface BabelCompile {
    source: string;
    destination: string;
    workspace: string;
}

interface BuildVariant {
    source: string;
    workspace: string;
    variant: string;
}

async function buildVariant({ variant, source, workspace }: BuildVariant) {
    const { code, map } = (await transformFileAsync(source, {
        envName: variant,
        cwd: workspace,
        sourceMaps: true
    })) as babel.BabelFileResult;

    const mapJson = JSON.stringify(map);

    const destination = join(
        workspace,
        "lib",
        variant,
        relative(workspace + "/src", source)
    ).replace(/\.tsx?$/, ".js");

    await Promise.all([
        fs.writeFile(destination, code, "utf8"),
        fs.writeFile(destination + ".map", mapJson, "utf8")
    ]);
}

export async function babelCompile({ source, destination, workspace }: BabelCompile) {
    if (BABEL_COMPILE_EXTENSIONS.includes(extname(source))) {
        // const start = Date.now();

        await Promise.all([
            buildVariant({
                variant: "esm",
                source,
                workspace
            }),
            buildVariant({
                variant: "cjs",
                source,
                workspace
            })
        ]);

        // const duration = (Date.now() - start) / 1000;
        // console.log(`Babel compiled in ${duration}s`);
        return;
    }

    return fs.copyFile(source, destination);
}

const tsProgramCache: Map<string, ParsedCommandLine> = new Map();

interface TsCompile {
    source: string;
    workspace: string;
}

export async function tsCompile({ source, workspace }: TsCompile) {
    // const start = Date.now();

    let parsedJsonConfigFile = tsProgramCache.get(workspace);

    if (!parsedJsonConfigFile) {
        const { config: readTsConfig } = ts.readConfigFile(
            join(workspace, "tsconfig.build.json"),
            ts.sys.readFile
        );

        parsedJsonConfigFile = ts.parseJsonConfigFileContent(readTsConfig, ts.sys, workspace);
    }

    const { projectReferences, options, errors } = parsedJsonConfigFile;

    const program = ts.createProgram({
        projectReferences,
        options: { ...options, skipLibCheck: true },
        rootNames: [source],
        configFileParsingDiagnostics: errors
    });

    const { diagnostics, emitSkipped } = program.emit();
    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics, errors);

    if (allDiagnostics.length) {
        const formatHost = {
            getCanonicalFileName(path: string) {
                return path;
            },
            getCurrentDirectory() {
                return workspace;
            },
            getNewLine() {
                return ts.sys.newLine;
            }
        };

        const message = ts.formatDiagnostics(allDiagnostics, formatHost);
        if (message) {
            // const duration = (Date.now() - start) / 1000;
            // console.log(`TS compiled with errors in ${duration}s`);
            throw Error(message);
        }
    }

    if (emitSkipped) {
        throw Error("TypeScript compilation failed.");
    }

    // const duration = (Date.now() - start) / 1000;
    // console.log(`TS compiled in ${duration}s`);
}
