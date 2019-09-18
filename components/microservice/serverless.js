const path = require("path");
const { Component } = require("@serverless/core");
const Template = require("@serverless/template");
const Context = require("@serverless/cli/src/Context");

class Microservice extends Component {
    async default(inputs = {}) {
        const cwd = process.cwd();
        const rootFolder = path.resolve(inputs.path);
        process.chdir(rootFolder);
        inputs.template = path.join(rootFolder, "serverless.yml");

        const config = {
            root: rootFolder,
            stateRoot: path.join(rootFolder, ".serverless"),
            debug: inputs.debug,
            entity: Template.constructor.name
        };

        const context = new Context(config);
        const component = new Template(undefined, context);
        await component.init();

        const output = await component(inputs);
        process.chdir(cwd);
        return output;
    }

    // TODO: report a bug - inputs are not passed to `remove`
    async remove(inputs = {}) {
        const rootFolder = path.resolve(inputs.path);
        process.chdir(rootFolder);
        inputs.template = path.join(rootFolder, "serverless.yml");

        const config = {
            root: rootFolder,
            stateRoot: path.join(rootFolder, ".serverless"),
            debug: inputs.debug,
            entity: Template.constructor.name
        };

        const context = new Context(config);
        const component = new Template(undefined, context);
        await component.init();

        return await component.remove(inputs);
    }
}

module.exports = Microservice;
