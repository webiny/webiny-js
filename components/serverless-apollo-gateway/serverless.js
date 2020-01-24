const { join } = require("path");
const fs = require("fs-extra");
const prettier = require("prettier");
const execa = require("execa");
const loadJson = require("load-json-file");
const camelCase = require("lodash.camelcase");
const isEqual = require("lodash.isequal");
const get = require("lodash.get");
const webpack = require("webpack");
const writeJson = require("write-json-file");
const { transform } = require("@babel/core");
const { Component } = require("@serverless/core");

const defaultDependencies = ["babel-loader"];

const getDeps = async deps => {
    const { dependencies } = await loadJson(join(__dirname, "package.json"));
    return deps.reduce((acc, item) => {
        acc[item] = dependencies[item];
        return acc;
    }, {});
};

const normalizePlugins = plugins => {
    const normalized = [];
    plugins.forEach(pl => {
        let factory,
            options = {};
        if (typeof pl === "string") {
            factory = pl;
        } else {
            factory = pl.factory;
            options = pl.options || {};
        }

        normalized.push({ factory, options });
    });

    return normalized;
};

class ApolloGateway extends Component {
    async default({ force = false, ...inputs } = {}) {
        if (isEqual(this.state.inputs, inputs) && !force) {
            this.context.instance.debug("Inputs were not changed, no action required.");
            return this.state.output;
        } else {
            this.state.inputs = inputs;
        }

        const {
            region,
            env = {},
            memory = 128,
            timeout = 10,
            description,
            debug = true,
            webpackConfig = null
        } = inputs;

        const plugins = normalizePlugins(inputs.plugins || []);
        env["DEBUG"] = "" + debug;

        if (inputs.services) {
            // Add backwards compatibility
            plugins.unshift({
                factory: "@webiny/api-plugin-create-apollo-gateway",
                options: {
                    server: {
                        introspection: env.GRAPHQL_INTROSPECTION,
                        playground: env.GRAPHQL_PLAYGROUND
                    },
                    services: inputs.services
                }
            });
        }

        const name =
            get(this.state, "output.name") ||
            this.context.instance.getResourceName(inputs.name || "apollo-gateway");

        const boilerplateRoot = join(this.context.instance.root, ".webiny");
        const componentRoot = join(boilerplateRoot, camelCase(this.context.instance.alias));
        fs.ensureDirSync(componentRoot);

        await this.save();

        // Generate boilerplate code
        const injectPlugins = [];
        plugins.forEach((pl, index) => {
            injectPlugins.push({
                name: `injectedPlugins${index + 1}`,
                path: pl.factory,
                options: pl.options
            });
        });

        const source = fs.readFileSync(__dirname + "/boilerplate/handler.js", "utf8");
        const { code } = await transform(source, {
            plugins: [
                Boolean(debug) ? [__dirname + "/transform/sourcemaps"] : null,
                [__dirname + "/transform/plugins", { plugins: injectPlugins }]
            ].filter(Boolean)
        });

        fs.writeFileSync(
            join(componentRoot, "handler.js"),
            prettier.format(code, { parser: "babel" })
        );

        fs.copyFileSync(
            join(__dirname, "boilerplate", "webpack.config.js"),
            join(componentRoot, "/webpack.config.js")
        );

        const pkgJsonPath = join(componentRoot, "package.json");
        fs.copyFileSync(join(__dirname, "boilerplate", "package.json"), pkgJsonPath);

        // Inject dependencies
        const pkgJson = await loadJson(pkgJsonPath);
        Object.assign(pkgJson.dependencies, await getDeps(defaultDependencies));
        await writeJson(pkgJsonPath, pkgJson);

        if (!fs.existsSync(join(componentRoot, "yarn.lock"))) {
            await execa("yarn", ["--production"], { cwd: componentRoot });
        }

        // Bundle code (switch CWD before running webpack)
        const cwd = process.cwd();
        process.chdir(componentRoot);

        this.context.instance.debug("Start bundling with webpack");
        await new Promise((res, reject) => {
            this.context.status("Building");

            // Create default webpack config
            let config = require(componentRoot + "/webpack.config.js")({
                instance: this,
                root: componentRoot,
                debug: Boolean(debug)
            });

            // Try loading webpack customizer
            if (webpackConfig) {
                try {
                    // Resolve customizer path relative to serverless.yml file
                    const customizerPath = require.resolve(webpackConfig, { paths: [cwd] });
                    if (!fs.existsSync(customizerPath)) {
                        this.context.instance.debug(
                            `Webpack customizer does not exist at %o!`,
                            customizerPath
                        );
                    } else {
                        this.context.instance.debug(
                            `Loading webpack customizer from %o`,
                            customizerPath
                        );
                        const customizer = require(customizerPath);
                        config = customizer({
                            config,
                            instance: this,
                            root: componentRoot,
                            debug: Boolean(debug)
                        });
                    }
                } catch (err) {
                    this.context.instance.debug(
                        `Error loading webpack customizer %o: %o`,
                        webpackConfig,
                        err.message
                    );
                }
            }

            webpack(config).run((err, stats) => {
                if (err) {
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    const info = stats.toJson();

                    if (stats.hasErrors()) {
                        console.error(info.errors);
                    }

                    return reject("Build failed!");
                }

                this.context.instance.debug("Finished bundling");
                res();
            });
        });

        // Restore initial CWD
        process.chdir(cwd);

        // Deploy lambda
        const lambda = await this.load("@webiny/serverless-function");

        const output = await lambda({
            name,
            region,
            description: description || "Apollo GraphQL Gateway (API entry point).",
            code: join(componentRoot, "build"),
            root: componentRoot,
            handler: "handler.handler",
            env,
            memory,
            timeout
        });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const lambda = await this.load("@webiny/serverless-function");
        await lambda.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ApolloGateway;
