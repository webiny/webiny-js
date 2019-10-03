const path = require("path");
const execa = require("execa");
const { Component } = require("@serverless/core");
const tracking = require("@webiny/serverless-component-tracking");

const component = "@webiny/serverless-function";

class ServerlessFunction extends Component {
    async default({ track, ...inputs } = {}) {
        await tracking({ track, context: this.context, component });

        const functionRoot = path.join(this.context.instance.root, inputs.root);

        if (inputs.hook) {
            this.context.log("Building function");
            const hooks = Array.isArray(inputs.hook) ? inputs.hook : [inputs.hook];
            for (let i = 0; i < hooks.length; i++) {
                const [cmd, ...args] = hooks[i].split(" ");
                await execa(cmd, args, {
                    cwd: functionRoot,
                    env: { NODE_ENV: "production" },
                    stdio: "inherit"
                });
            }
        }

        const lambda = await this.load("@serverless/function");
        return await lambda(inputs);
    }

    async remove({ track, ...inputs } = {}) {
        await tracking({ track, context: this.context, component, method: "remove" });

        const lambda = await this.load("@serverless/function");

        return await lambda.remove(inputs);
    }
}

module.exports = ServerlessFunction;
