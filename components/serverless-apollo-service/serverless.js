const path = require("path");
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
            dependencies = []
        } = inputs;

        if (!componentName) {
            throw Error(`"inputs.name" is a required parameter!`);
        }

        if (database) {
            env["MONGODB_SERVER"] = database.server;
            env["MONGODB_NAME"] = database.name;
        }

        const injectPlugins = [];
        const boilerplateRoot = path.join(this.context.instance.root, ".webiny");
        const componentRoot = path.join(boilerplateRoot, componentName);
        fs.ensureDirSync(path.join(boilerplateRoot, componentName));

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
            path.join(componentRoot, "handler.js"),
            prettier.format(code, { parser: "babel" })
        );

        fs.copyFileSync(
            path.join(__dirname, "boilerplate", "config.js"),
            path.join(componentRoot, "config.js")
        );

        fs.copyFileSync(
            path.join(__dirname, "boilerplate", "webpack.config.js"),
            path.join(componentRoot, "webpack.config.js")
        );

        const pkgJsonPath = path.join(componentRoot, "package.json");
        const cmpPkgJsonPath = path.join(__dirname, "package.json");
        fs.copyFileSync(path.join(__dirname, "boilerplate", "package.json"), pkgJsonPath);

        // Inject dependencies
        const pkgJson = await loadJson(pkgJsonPath);
        const componentPkgJson = await loadJson(cmpPkgJsonPath);

        defaultDependencies.concat(dependencies).forEach(dep => {
            pkgJson.dependencies[dep] = componentPkgJson.dependencies[dep];
        });

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
            code: path.join(componentRoot, "build"),
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
        await trackComponent({ track, context: this.context, component });
        const apiGw = await this.load("@serverless/aws-api-gateway");
        await apiGw.remove(inputs);

        const lambda = await this.load("@serverless/function");
        await lambda.remove(inputs);
    }
}

module.exports = ApolloService;
