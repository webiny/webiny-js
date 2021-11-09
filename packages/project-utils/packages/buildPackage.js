const fs = require("fs");
const rimraf = require("rimraf");
const { join, dirname, extname } = require("path");
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
const babelCompile = async ({ config }) => {
    // We're passing "*.*" just because we want to copy all files that cannot be compiled.
    // We want to have the same behaviour that the Babel CLI's "--copy-files" flag provides.
    const files = glob.sync(join(config.cwd, "src/**/*.*").replace(/\\/g, "/"), { nodir: true });
    const compilations = [];
    const copyTasks = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (BABEL_COMPILE_EXTENSIONS.includes(extname(file))) {
            compilations.push(
                babel.transformFileAsync(file, { cwd: config.cwd }).then(results => [file, results])
            );
        } else {
            copyTasks.push(file);
        }
    }

    await Promise.all(compilations);

    const writes = [];
    for (let i = 0; i < compilations.length; i++) {
        const [file, { code, map }] = await compilations[i];

        const paths = {
            code: file.replace("src", "dist").replace(".ts", ".js"),
            map: file.replace("src", "dist").replace(".ts", ".js") + ".map"
        };
        fs.mkdirSync(dirname(paths.code), { recursive: true });
        writes.push(fs.promises.writeFile(paths.code, code, "utf8"));
        writes.push(paths.map, map, "utf8");
    }

    const copies = [];
    for (let i = 0; i < copyTasks.length; i++) {
        const file = copyTasks[i];
        const destPath = file.replace("src", "dist");
        fs.mkdirSync(dirname(destPath), { recursive: true });
        copies.push(fs.promises.copyFile(file, destPath));
    }

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
