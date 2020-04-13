const { resolve, join } = require("path");
const { Context } = require("./Context");

module.exports.execute = async (inputs, method, context) => {
    const projectRoot = context.paths.projectRoot;
    const { env, debug, folder } = inputs;

    // Load .env.json from project root
    await context.loadEnv(resolve(projectRoot, ".env.json"), env, { debug });

    // Create component context
    const componentContext = new Context({
        logger: context,
        stateRoot: join(projectRoot, ".webiny", "state"),
        stackStateRoot: join(projectRoot, ".webiny", "state", folder, env),
        stackName: `${context.projectName}_${folder}`,
        env,
        debug
    });
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
