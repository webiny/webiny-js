const { join } = require("path");
const fs = require("fs-extra");
const prettier = require("prettier");
const webpack = require("webpack");
const execa = require("execa");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const camelCase = require("lodash.camelcase");
const { transform } = require("@babel/core");
const { Component } = require("@serverless/core");

const defaultDependencies = [
    "date-fns",
    "mongodb",
    "@webiny/api",
    "@webiny/api-security",
    "babel-loader"
];

const getDeps = async deps => {
    const { dependencies } = await loadJson(join(__dirname, "package.json"));
    return deps.reduce((acc, item) => {
        acc[item] = dependencies[item];
        return acc;
    }, {});
};

class ApolloService extends Component {
    async default(inputs = {}) {
        const {
            region,
            endpoints = [],
            name,
            plugins = [],
            env = {},
            database,
            memory = 512,
            timeout = 10,
            description,
            endpointTypes = ["REGIONAL"],
            binaryMediaTypes = [],
            dependencies = {},
            webpackConfig = null
        } = inputs;

        if (!name) {
            throw Error(`"inputs.name" is a required parameter!`);
        }

        if (database) {
            env["MONGODB_SERVER"] = database.server;
            env["MONGODB_NAME"] = database.name;
        }

        const injectPlugins = [];
        const boilerplateRoot = join(this.context.instance.root, ".webiny");
        const componentRoot = join(boilerplateRoot, camelCase(name));
        fs.ensureDirSync(componentRoot);

        this.state.inputs = inputs;
        await this.save();

        plugins.forEach((pl, index) => {
            let factory,
                options = null;

            if (typeof pl === "string") {
                factory = pl;
            } else {
                factory = pl.factory;
                options = pl.options || null;
            }

            injectPlugins.push({
                name: `injectedPlugins${index + 1}`,
                path: factory,
                options
            });
        });

        // Generate boilerplate code
        const source = fs.readFileSync(__dirname + "/boilerplate/handler.js", "utf8");
        const { code } = await transform(source, {
            plugins: [[__dirname + "/transform/plugins", { plugins: injectPlugins }]]
        });

        fs.writeFileSync(
            join(componentRoot, "handler.js"),
            prettier.format(code, { parser: "babel" })
        );

        fs.copyFileSync(
            join(__dirname, "boilerplate", "config.js"),
            join(componentRoot, "config.js")
        );

        fs.copyFileSync(
            join(__dirname, "boilerplate", "webpack.config.js"),
            join(componentRoot, "webpack.config.js")
        );

        const pkgJsonPath = join(componentRoot, "package.json");
        fs.copyFileSync(join(__dirname, "boilerplate", "package.json"), pkgJsonPath);

        // Inject dependencies
        const pkgJson = await loadJson(pkgJsonPath);
        Object.assign(pkgJson.dependencies, await getDeps(defaultDependencies), dependencies);
        await writeJson(pkgJsonPath, pkgJson);

        await execa("npm", ["install", "--production"], { cwd: componentRoot });

        // Bundle code (switch CWD before running webpack)
        const cwd = process.cwd();
        process.chdir(componentRoot);

        await new Promise((res, reject) => {
            this.context.status("Building");
            let config = require(componentRoot + "/webpack.config.js");
            if (webpackConfig) {
                try {
                    // Resolve customizer path relative to serverless.yml file
                    const customizerPath = require.resolve(webpackConfig, { paths: [cwd] });
                    if (!fs.existsSync(customizerPath)) {
                        this.context.debug(
                            `Webpack customizer does not exist at "${customizerPath}"!`
                        );
                    } else {
                        const customizer = require(customizerPath);
                        config = customizer({ config, instance: this, root: componentRoot });
                    }
                } catch (err) {
                    this.context.debug(
                        `Error loading webpack customizer ${webpackConfig}: ${err.message}`
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

                res();
            });
        });

        // Restore initial CWD
        process.chdir(cwd);

        // Deploy lambda
        const lambda = await this.load("@webiny/serverless-function");
        const apiGw = await this.load("@webiny/serverless-api-gateway");

        const lambdaOut = await lambda({
            region,
            description: `serverless-apollo-service: ${description || name}`,
            code: join(componentRoot, "build"),
            root: componentRoot,
            handler: "handler.handler",
            env,
            memory,
            timeout
        });

        this.context.debug(`Deploying API Gateway`);
        const apiGwOut = await apiGw({
            region,
            name,
            description: `API for ${name}`,
            stage: "prod",
            binaryMediaTypes,
            endpointTypes,
            endpoints: [{ path: "/graphql", method: "ANY", function: lambdaOut.arn }, ...endpoints]
        });

        const output = {
            api: apiGwOut,
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
