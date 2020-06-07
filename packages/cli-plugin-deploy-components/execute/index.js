const AWS = require("aws-sdk");
const { resolve, join } = require("path");
const { Context } = require("./Context");

// For slower internet connections we want to set a longer timeout
AWS.config.update({
    httpOptions: { timeout: process.env.AWS_CLIENT_TIMEOUT || 300000 }
});

module.exports.execute = async (inputs, method, context) => {
    const projectRoot = context.paths.projectRoot;
    const { env, debug, stack } = inputs;

    // Load .env.json from project root
    await context.loadEnv(resolve(projectRoot, ".env.json"), env, { debug });

    // Create component context
    const componentContext = new Context({
        logger: context,
        projectName: context.projectName,
        stateRoot: join(projectRoot, ".webiny", "state"),
        stackStateRoot: join(projectRoot, ".webiny", "state", stack, env),
        stackName: `${context.projectName}_${stack}`,
        env,
        debug
    });
    componentContext.projectName = context.projectName;
    await componentContext.init();

    context.instanceId = componentContext.state.id;

    try {
        // Load .env.json from cwd (this will change depending on the folder you specified)
        await context.loadEnv(resolve(".env.json"), inputs.env, { debug });

        const Template = require("./template");
        const component = new Template(`Webiny`, componentContext);
        await component.init();

        // IMPORTANT: In `watch` mode, this promise will never resolve.
        // We need it to keep webpack compilers running.
        await component[method](inputs, context);

        if (debug) {
            // Add an empty line after debug output for nicer output
            console.log();
        }
    } catch (err) {
        componentContext.clearStatus();
        console.log();
        console.log(err);
        console.log();
    } finally {
        componentContext.clearStatus();
    }
};
