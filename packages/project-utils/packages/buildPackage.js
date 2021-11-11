const fs = require("fs");
const rimraf = require("rimraf");
const { join, dirname, extname, relative, parse } = require("path");
const { log } = require("@webiny/cli/utils");
const babel = require("@babel/core");
const ts = require("ttypescript");
const glob = require("glob");
const merge = require("lodash/merge");

module.exports = async params => {
    const start = new Date();

    const prebuild = params.options.prebuild || defaults.prebuild;
    if (typeof prebuild === "function") {
        await prebuild(params);
    }

    const build = params.options.build || defaults.build;
    if (typeof build === "function") {
        await build(params);
    }

    const postbuild = params.options.postbuild || defaults.postbuild;
    if (typeof postbuild === "function") {
        await postbuild(params);
    }

    const duration = (new Date() - start) / 1000;
    params.options.logs !== false &&
        log.info(`Done! Build finished in ${log.info.hl(duration + "s")}.`);

    return { duration };
};

const defaults = {
    prebuild: params => {
        const { config } = params;
        params.options.logs !== false && log.info("Deleting existing build files...");
        rimraf.sync(join(config.cwd, "./dist"));
        rimraf.sync(join(config.cwd, "*.tsbuildinfo"));
    },
    build: async params => {
        params.options.logs !== false && log.info("Building...");
        await Promise.all([tsCompile(params), babelCompile(params)]);
    },
    postbuild: params => {
        params.options.logs !== false && log.info("Copying meta files...");
        copyToDist("package.json", params);
        copyToDist("LICENSE", params);
        copyToDist("README.md", params);
    }
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

const babelCompile = async ({ config }) => {
    // We're passing "*.*" just because we want to copy all files that cannot be compiled.
    // We want to have the same behaviour that the Babel CLI's "--copy-files" flag provides.
    const files = glob.sync(join(config.cwd, "src/**/*.*").replace(/\\/g, "/"), { nodir: true });
    const compilations = [];
    const copies = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (BABEL_COMPILE_EXTENSIONS.includes(extname(file))) {
            compilations.push(
                babel.transformFileAsync(file, { cwd: config.cwd }).then(results => [file, results])
            );
        } else {
            copies.push(
                new Promise((resolve, reject) => {
                    try {
                        const destPath = getDistCopyFilePath({ file, cwd: config.cwd });
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
        const [file, { code, map }] = await compilations[i];

        const paths = getDistFilePaths({ file, cwd: config.cwd });
        fs.mkdirSync(dirname(paths.code), { recursive: true });
        writes.push(fs.promises.writeFile(paths.code, code, "utf8"));
        writes.push(paths.map, map, "utf8");
    }

    // Wait until all files have been written to disk.
    return Promise.all([...writes, ...copies]);
};

const tsCompile = params => {
    return new Promise((resolve, reject) => {
        let { config: readTsConfig } = ts.readConfigFile(
            join(params.config.cwd, "tsconfig.build.json"),
            ts.sys.readFile
        );

        const { overrides } = params.options;
        if (overrides) {
            if (overrides.tsConfig) {
                if (typeof overrides.tsConfig === "function") {
                    readTsConfig = overrides.tsConfig(readTsConfig);
                } else {
                    merge(readTsConfig, overrides.tsConfig);
                }

                if (params.options.debug) {
                    log.info(`${log.info.hl("tsconfig.build.json")} overridden. New config:`);
                    console.log(readTsConfig);
                }
            }
        }

        const parsedJsonConfigFile = ts.parseJsonConfigFileContent(
            readTsConfig,
            ts.sys,
            params.config.cwd
        );

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
                getCurrentDirectory: () => params.config.cwd,
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

const copyToDist = (path, { config, options }) => {
    const from = join(config.cwd, path);
    const to = join(config.cwd, "dist", path);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        options.logs !== false && log.info(`Copied ${log.info.hl(path)}.`);
    }
};
