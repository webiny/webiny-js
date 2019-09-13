const path = require("path");
const execa = require("execa");
const { Component } = require("@serverless/core");

class ServerlessFunction extends Component {
    async default(inputs = {}) {
        const functionRoot = path.join(this.context.instance.root, inputs.root);
        if (inputs.env) {
            Object.keys(inputs.env).forEach(key => {
                if (inputs.env[key] === "__wby_inject__") {
                    inputs.env[key] = process.env[key];
                }
            });
        }
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
}

module.exports = ServerlessFunction;
