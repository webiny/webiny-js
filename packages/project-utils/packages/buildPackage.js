const fs = require("fs");
const rimraf = require("rimraf");
const { join, dirname, extname, relative, parse } = require("path");
const babel = require("@babel/core");
const ts = require("ttypescript");
const glob = require("glob");
const merge = require("lodash/merge");

module.exports = async options => {
    const start = new Date();

    const { cwd } = options;
    options.logs !== false && console.log("Deleting existing build files...");
    rimraf.sync(join(cwd, "./dist"));
    rimraf.sync(join(cwd, "*.tsbuildinfo"));

    options.logs !== false && console.log("Building...");
    await Promise.all([tsCompile(options), babelCompile(options)]);

    options.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", options);
    copyToDist("LICENSE", options);
    copyToDist("README.md", options);

    const duration = (new Date() - start) / 1000;
    options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

    return { duration };
};

const BABEL_COMPILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

// Returns final "dist" paths for given given origin ".ts" / ".tsx" file path.
const getDistFilePaths = ({ file, cwd }) => {
    const { dir, name } = parse(file);

    const relativeDir = relative(cwd, dir);

    const code = join(cwd, relativeDir.replace("src", "dist"), name + ".js");
    const map = join(cwd, relativeDir.replace("src", "dist"), name + ".js.map");
    return { code, map };
};

// Returns final "dist" paths for given given origin ".ts" / ".tsx" file path.
const getDistCopyFilePath = ({ file, cwd }) => {
    const relativeDir = relative(cwd, file);
    return join(cwd, relativeDir.replace("src", "dist"));
};

const babelCompile = async ({ cwd }) => {
    // We're passing "*.*" just because we want to copy all files that cannot be compiled.
    // We want to have the same behaviour that the Babel CLI's "--copy-files" flag provides.
    const files = glob.sync(join(cwd, "src/**/*.*").replace(/\\/g, "/"), { nodir: true });
    const compilations = [];
    const copies = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (BABEL_COMPILE_EXTENSIONS.includes(extname(file))) {
            compilations.push(
                babel
                    .transformFileAsync(file, {
                        cwd,
                        sourceMaps: true
                    })
                    .then(results => [file, results])
            );
        } else {
            copies.push(
                new Promise((resolve, reject) => {
                    try {
                        const destPath = getDistCopyFilePath({ file, cwd });
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
    }

    // At this point, just wait for compilations to be completed so we can proceed with writing the files ASAP.
    await Promise.all(compilations);

    const writes = [];
    for (let i = 0; i < compilations.length; i++) {
        const [file, result] = await compilations[i];
        const { code, map } = result;

        const paths = getDistFilePaths({ file, cwd });
        fs.mkdirSync(dirname(paths.code), { recursive: true });

        // Save the compiled JS file.
        writes.push(fs.promises.writeFile(paths.code, code, "utf8"));

        // Save source maps file.
        const mapJson = JSON.stringify(map);
        writes.push(fs.promises.writeFile(paths.map, mapJson, "utf8"));
    }

    // Wait until all files have been written to disk.
    return Promise.all([...writes, ...copies]);
};

const tsCompile = ({ cwd, overrides, debug }) => {
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

const copyToDist = (path, { cwd, logs }) => {
    const from = join(cwd, path);
    const to = join(cwd, "dist", path);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        logs !== false && console.log(`Copied ${path}.`);
    }
};
