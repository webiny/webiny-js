const fs = require("fs");
const rimraf = require("rimraf");
const { join, dirname, extname } = require("path");
const babel = require("@babel/core");
const ts = require("ttypescript");
const glob = require("glob");
const merge = require("lodash/merge");

module.exports = async options => {
    const start = new Date();

    const { config } = options;
    options.logs !== false && console.log("Deleting existing build files...");
    rimraf.sync(join(config.cwd, "./dist"));
    rimraf.sync(join(config.cwd, "*.tsbuildinfo"));

    options.logs !== false && console.log("Building...");
    await Promise.all([tsCompile(options), babelCompile(options)]);

    options.logs !== false && console.log("Copying meta files...");
    copyToDist("package.json", options);
    copyToDist("LICENSE", options);
    copyToDist("README.md", options);

    const duration = (new Date() - start) / 1000;
    options.logs !== false &&
        console.log(`Done! Build finished in ${console.log.hl(duration + "s")}.`);

    return { duration };
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
                        const destPath = file.replace("src", "dist");
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

        const paths = {
            code: file.replace("src", "dist").replace(".ts", ".js"),
            map: file.replace("src", "dist").replace(".ts", ".js") + ".map"
        };
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
                    console.log(`${console.log.hl("tsconfig.build.json")} overridden. New config:`);
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
        options.logs !== false && console.log(`Copied ${console.log.hl(path)}.`);
    }
};
