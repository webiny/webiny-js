const fs = require("fs");
const rimraf = require("rimraf");
const { join, dirname } = require("path");
const { log } = require("@webiny/cli/utils");
const babel = require("@babel/core");
const ts = require("typescript");
const glob = require("glob");

module.exports = async params => {
    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

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

    log.info(`Done! Build finished in ${log.info.hl(getDuration() + "s")}.`);
};

const defaults = {
    prebuild: ({ config }) => {
        log.info("Deleting existing build files...");
        rimraf.sync(join(config.cwd, "./dist"));
        rimraf.sync(join(config.cwd, "*.tsbuildinfo"));
    },
    build: async ({ config }) => {
        log.info("Building...");
        const files = glob.sync(join(config.cwd, "src/**/*.{ts,tsx}").replace(/\\/g, "/"));



        const compilations = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            compilations.push(
                babel
                    .transformFile(file, {
                        sourceMaps: true,

                        jsc: {
                            parser: {
                                syntax: "typescript"
                            },
                            target: "es2020",
                            paths: {
                                "~/*": ["./src/*"]
                            },
                            baseUrl: "."
                        },
                        module: {
                            type: "commonjs"
                        }
                    })
                    .then(results => [file, results])
            );
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

        await Promise.all(writes);
        compile(files, {
            allowJs: true,
            declaration: true,
            emitDeclarationOnly: true,
            skipLibCheck: true
        });
    },
    postbuild: ({ config }) => {
        // // Check if `ttypescript` is defined as a devDependency and use that instead of `typescript`.
        // const pkg = require(join(process.cwd(), "package.json"));
        // log.info("Generating TypeScript types...");
        // const binary = "ttypescript" in (pkg.devDependencies || {}) ? "ttsc" : "tsc";
        // execa.sync("yarn", [binary, "-p", "tsconfig.build.json"], { stdio: "inherit" });

        log.info("Copying meta files...");
        copyToDist(config.cwd, "package.json");
        copyToDist(config.cwd, "LICENSE");
        copyToDist(config.cwd, "README.md");
    }
};

const copyToDist = (cwd, path) => {
    const from = join(cwd, path);
    const to = join(cwd, "dist", path);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        log.info(`Copied ${log.info.hl(path)}.`);
    }
};

function compile(fileNames, options) {
    // Create a Program with an in-memory emit
    const host = ts.createCompilerHost(options);
    host.writeFile = (fileName, contents) => {
        const dtsPath = fileName.replace("src", "dist");
        fs.mkdirSync(dirname(dtsPath), { recursive: true });
        fs.writeFileSync(dtsPath, contents, "utf8");
    };

    // Prepare and emit the d.ts files
    const program = ts.createProgram(fileNames, options, host);
    program.emit();
}
