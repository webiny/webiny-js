const { join } = require("path");
const fs = require("fs-extra");
const prettier = require("prettier");
const webpack = require("webpack");
const execa = require("execa");
const camelCase = require("lodash.camelcase");
const get = require("lodash.get");
const { transform } = require("@babel/core");
const { Component } = require("@serverless/core");

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

const addBackwardsCompatibility = (inputs, plugins) => {
    if (inputs.database) {
        // Means this is the old template structure
        // add "@webiny/api-plugin-create-apollo-handler" with new options object from "env"
        plugins.unshift({
            factory: "@webiny/api-plugin-create-apollo-handler",
            options: {
                server: {
                    introspection: inputs.env.GRAPHQL_INTROSPECTION,
                    playground: inputs.env.GRAPHQL_PLAYGROUND
                }
            }
        });

        // add "@webiny/api-plugin-commodo-mongodb" with new options object from "database"
        plugins.unshift({
            factory: "@webiny/api-plugin-commodo-mongodb",
            options: { database: inputs.database }
        });

        // add "@webiny/api-security/plugins/service" with new options object from "env"
        const secOptions = { token: { expiresIn: 2592000, secret: inputs.env.JWT_SECRET } };
        const secIndex = plugins.findIndex(pl => pl.factory === "@webiny/api-security/plugins");
        if (secIndex === -1) {
            plugins.unshift({
                factory: "@webiny/api-security/plugins/service",
                options: secOptions
            });
        } else {
            if (!plugins[secIndex].options.token) {
                plugins[secIndex].options = secOptions;
            }
        }
    }

    return plugins;
};

const dedupePlugins = plugins => {
    return plugins
        .reverse()
        .reduce((acc, pl) => {
            if (!acc.find(item => item.factory === pl.factory)) {
                acc.push(pl);
            }
            return acc;
        }, [])
        .reverse();
};

class ApolloService extends Component {
    async default(inputs = {}) {
        const {
            region,
            endpoints = [],
            graphqlPath = "/graphql",
            env = {},
            memory = 512,
            timeout = 10,
            debug = true,
            endpointTypes = ["REGIONAL"],
            binaryMediaTypes = [],
            webpackConfig = null
        } = inputs;

        env["DEBUG"] = "" + debug;

        let plugins = normalizePlugins(inputs.plugins || []);

        // TODO: remove in the next major release
        plugins = addBackwardsCompatibility(inputs, plugins);
        plugins = dedupePlugins(plugins);

        const name =
            get(this.state, "output.graphql.name") ||
            this.context.instance.getResourceName(inputs.name || "graphql");

        const injectPlugins = [];
        const boilerplateRoot = join(this.context.instance.root, ".webiny");
        const componentRoot = join(boilerplateRoot, camelCase(this.context.instance.alias));
        fs.ensureDirSync(componentRoot);

        this.state.inputs = inputs;
        await this.save();

        plugins.forEach((pl, index) => {
            injectPlugins.push({
                name: `injectedPlugins${index + 1}`,
                path: pl.factory,
                options: pl.options
            });
        });

        // Generate boilerplate code
        this.context.instance.debug("Generating boilerplate code at %o", componentRoot);
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
            join(componentRoot, "webpack.config.js")
        );

        const pkgJsonPath = join(componentRoot, "package.json");
        fs.copyFileSync(join(__dirname, "boilerplate", "package.json"), pkgJsonPath);

        if (!fs.existsSync(join(componentRoot, "yarn.lock"))) {
            this.context.instance.debug("Installing dependencies");
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
                        console.error(info.errors[0]);
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
        const apiGw = await this.load("@webiny/serverless-api-gateway");

        this.context.instance.debug("Deploy lambda");
        const lambdaOut = await lambda({
            name,
            region,
            description: `GraphQL server for ${this.context.instance.alias}.`,
            code: join(componentRoot, "build"),
            root: componentRoot,
            handler: "handler.handler",
            env,
            memory,
            timeout
        });

        this.context.instance.debug(`Deploying API Gateway`);
        const apiGwOut = await apiGw({
            region,
            description: `API for ${this.context.instance.alias}`,
            stage: "prod",
            binaryMediaTypes,
            endpointTypes,
            endpoints: [{ path: graphqlPath, method: "ANY", function: lambdaOut.arn }, ...endpoints]
        });

        this.context.instance.debug("Finished API Gateway deployment: %o", apiGwOut.url);

        const output = {
            api: { ...apiGwOut, graphqlUrl: apiGwOut.url + graphqlPath },
            graphql: lambdaOut
        };

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const apiGw = await this.load("@webiny/serverless-api-gateway");
        await apiGw.remove(inputs);

        const lambda = await this.load("@webiny/serverless-function");
        await lambda.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ApolloService;
