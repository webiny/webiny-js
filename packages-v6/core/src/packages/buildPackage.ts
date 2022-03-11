import fs from "fs";
import rimrafCb from "rimraf";
import { join, dirname, extname, relative, parse } from "path";
import babel from "@babel/core";
import ts from "ttypescript";
import glob from "glob";

interface BuildPackageParams {
    directory: string;
}

async function rimraf(path: string) {
    return new Promise<void>((resolve, reject) => {
        rimrafCb(path, {}, err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

export async function buildPackage({ directory }: BuildPackageParams) {
    await Promise.all([rimraf(join(directory, "./lib")), rimraf(join(directory, "*.tsbuildinfo"))]);
    await Promise.all([tsCompile(directory), babelCompile(directory)]);
}

const BABEL_COMPILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

// Returns final "dist" paths for given given origin ".ts" / ".tsx" file path.
const getDistFilePaths = (file: string, directory: string) => {
    const { dir, name } = parse(file);

    const relativeDir = relative(directory, dir);

    const code = join(directory, relativeDir.replace("src", "dist"), name + ".js");
    const map = join(directory, relativeDir.replace("src", "dist"), name + ".js.map");
    return { code, map };
};

// Returns final "dist" paths for given given origin ".ts" / ".tsx" file path.
const getDistCopyFilePath = (file: string, directory: string) => {
    const relativeDir = relative(directory, file);
    return join(directory, relativeDir.replace("src", "lib"));
};

const babelCompile = async (directory: string) => {
    // We're passing "*.*" just because we want to copy all files that cannot be compiled.
    // We want to have the same behaviour that the Babel CLI's "--copy-files" flag provides.
    const files = glob.sync(join(directory, "src/**/*.*").replace(/\\/g, "/"), { nodir: true });
    const compilations: Array<Promise<[string, babel.BabelFileResult]>> = [];
    const copies = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (BABEL_COMPILE_EXTENSIONS.includes(extname(file))) {
            compilations.push(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                babel.transformFileAsync(file, { cwd: directory }).then(result => [file, result!])
            );
            continue;
        }

        copies.push(
            new Promise<void>((resolve, reject) => {
                try {
                    const destPath = getDistCopyFilePath(file, directory);
                    if (!fs.existsSync(dirname(destPath))) {
                        fs.mkdirSync(dirname(destPath), { recursive: true });
                    }

                    fs.copyFileSync(file, destPath);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            })
        );
    }

    // At this point, just wait for compilations to be completed so we can proceed with writing the files ASAP.
    await Promise.all(compilations);

    const writes = [];
    for (let i = 0; i < compilations.length; i++) {
        const [file, { code, map }] = await compilations[i];

        const paths = getDistFilePaths(file as string, directory);
        fs.mkdirSync(dirname(paths.code), { recursive: true });
        writes.push(fs.promises.writeFile(paths.code, code, "utf8"));
        writes.push(paths.map, map, "utf8");
    }

    // Wait until all files have been written to disk.
    return Promise.all([...writes, ...copies]);
};

const tsCompile = (directory: string) => {
    return new Promise<void>((resolve, reject) => {
        const { config: readTsConfig } = ts.readConfigFile(
            join(directory, "tsconfig.build.json"),
            ts.sys.readFile
        );

        const parsedJsonConfigFile = ts.parseJsonConfigFileContent(readTsConfig, ts.sys, directory);
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
                getCanonicalFileName: (path: string) => path,
                getCurrentDirectory: () => directory,
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
