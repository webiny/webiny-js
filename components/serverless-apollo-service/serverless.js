const { join } = require("path");
const fs = require("fs-extra");
const { transform } = require("@babel/core");
const prettier = require("prettier");
const { Component } = require("@serverless/core");
const webpack = require("webpack");
const execa = require("execa");
const { trackComponent } = require("@webiny/tracking");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");

const component = "@webiny/serverless-apollo-service";
const defaultDependencies = ["date-fns", "mongodb", "@webiny/api", "@webiny/api-security"];

const getDeps = async deps => {
    const { dependencies } = await loadJson(join(__dirname, "package.json"));
    return deps.reduce((acc, item) => {
        acc[item] = dependencies[item];
        return acc;
    }, {});
};

class ApolloService extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component });

        const {
            extraEndpoints = [],
            name: componentName,
            plugins = [],
            env = {},
            database,
            memory = 128,
            timeout = 10,
            description,
            endpointTypes = ["REGIONAL"],
            dependencies = {}
        } = inputs;

        if (!componentName) {
            throw Error(`"inputs.name" is a required parameter!`);
        }

        if (database) {
            env["MONGODB_SERVER"] = database.server;
            env["MONGODB_NAME"] = database.name;
        }

        const injectPlugins = [];
        const boilerplateRoot = join(this.context.instance.root, ".webiny");
        const componentRoot = join(boilerplateRoot, componentName);
        fs.ensureDirSync(join(boilerplateRoot, componentName));

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

        await execa("npm", ["install"], { cwd: componentRoot });

        // Bundle code (switch CWD before running webpack)
        const cwd = process.cwd();
        process.chdir(componentRoot);

        await new Promise((resolve, reject) => {
            this.context.status("Building");
            const config = require(componentRoot + "/webpack.config.js");
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

                resolve();
            });
        });

        // Restore initial CWD
        process.chdir(cwd);

        // Deploy lambda
        const lambda = await this.load("@serverless/function");
        const apiGw = await this.load("@serverless/aws-api-gateway");

        const lambdaOut = await lambda({
            description: description || `Apollo Server: ${componentName}`,
            code: join(componentRoot, "build"),
            handler: "handler.handler",
            env,
            memory,
            timeout
        });

        this.context.debug(`[${componentName}] Deploying API Gateway`);
        const apiGwOut = await apiGw({
            name: componentName,
            description: `API for ${componentName}`,
            stage: "prod",
            endpointTypes,
            endpoints: [
                { path: "/graphql", method: "ANY", function: lambdaOut.arn },
                ...extraEndpoints
            ]
        });

        const output = {
            api: apiGwOut,
            graphql: lambdaOut
        };

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component, method: "remove" });
        const apiGw = await this.load("@serverless/aws-api-gateway");
        await apiGw.remove(inputs);

        const lambda = await this.load("@serverless/function");
        await lambda.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ApolloService;
