const path = require("path");
const fs = require("fs-extra");
const { transform } = require("@babel/core");
const prettier = require("prettier");
const { Component } = require("@serverless/core");
const webpack = require("webpack");
const { trackComponent } = require("@webiny/tracking");

const component = "@webiny/serverless-apollo-service";

class ApolloService extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component });

        const {
            endpoints = [],
            name: componentName,
            plugins = [],
            env = {},
            database,
            memory = 128,
            timeout = 10,
            description,
            endpointTypes = ["REGIONAL"]
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
            path.join(componentRoot, "/webpack.config.js")
        );

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
                    this.context.log(
                        stats.toString({
                            colors: true
                        })
                    );
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

    async remove({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component });
        const apiGw = await this.load("@serverless/aws-api-gateway");
        await apiGw.remove(inputs);

        const lambda = await this.load("@serverless/function");
        await lambda.remove(inputs);
    }
}

module.exports = ApolloService;
