const path = require("path");
const fs = require("fs-extra");
const { transform } = require("@babel/core");
const prettier = require("prettier");
const { Component } = require("@serverless/core");
const webpack = require("webpack");

class ApolloGateway extends Component {
    async default(inputs = {}) {
        const {
            name: componentName = null,
            services = [],
            buildHeaders = __dirname + "/boilerplate/buildHeaders.js",
            env = {},
            memory = 128,
            timeout = 10,
            description
        } = inputs;

        if (!componentName) {
            throw Error(`"inputs.name" is a required parameter!`);
        }

        const boilerplateRoot = path.join(this.context.instance.root, ".webiny");
        const componentRoot = path.join(boilerplateRoot, componentName);

        this.state.inputs = inputs;
        await this.save();

        fs.ensureDirSync(path.join(boilerplateRoot, componentName));

        // Generate boilerplate code
        const source = fs.readFileSync(__dirname + "/boilerplate/handler.js", "utf8");
        const { code } = await transform(source, {
            plugins: [[__dirname + "/transform/services", { services }]]
        });

        fs.writeFileSync(
            path.join(componentRoot, "handler.js"),
            prettier.format(code, { parser: "babel" })
        );

        fs.copyFileSync(
            path.join(__dirname, "boilerplate", "webpack.config.js"),
            path.join(componentRoot, "/webpack.config.js")
        );

        fs.copyFileSync(path.resolve(buildHeaders), path.join(componentRoot, "/buildHeaders.js"));

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

        return await lambda({
            description: description || `Apollo Gateway: ${componentName}`,
            code: path.join(componentRoot, "build"),
            handler: "handler.handler",
            env,
            memory,
            timeout
        });
    }

    async remove(inputs = {}) {
        const lambda = await this.load("@serverless/function");
        await lambda.remove(inputs);
    }
}

module.exports = ApolloGateway;
