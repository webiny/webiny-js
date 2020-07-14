const AWS = require("aws-sdk");
const { resolve, join } = require("path");
const { Context } = require("./Context");

// For slower internet connections we want to set a longer timeout
AWS.config.update({
    httpOptions: { timeout: process.env.AWS_CLIENT_TIMEOUT || 300000 }
});

module.exports.execute = async (inputs, method, context) => {
    const projectRoot = context.paths.projectRoot;
    const { env, debug, stack, isFirstDeploy, beforeExecute } = inputs;

    // Load .env.json from project root
    await context.loadEnv(resolve(projectRoot, ".env.json"), env, { debug });

    // Execute `beforeExecute` before instantiating template state
    if (typeof beforeExecute === "function") {
        await beforeExecute();
    }

    // Create component context
    const componentContext = new Context(
        {
            logger: context,
            projectName: context.projectName,
            stateRoot: join(projectRoot, ".webiny", "state"),
            stackStateRoot: join(projectRoot, ".webiny", "state", stack, env),
            stackName: `${context.projectName}_${stack}`,
            env,
            debug
        },
        context
    );
    componentContext.projectName = context.projectName;
    await componentContext.init();

    context.instanceId = componentContext.state.id;

    try {
        // Load .env.json from cwd (this will change depending on the folder you specified)
        await context.loadEnv(resolve(".env.json"), inputs.env, { debug });

        if (method === "default" && isFirstDeploy) {
            // Let's check for correct Mongo credentials
            if (process.env.MONGODB_SERVER) {
                const ora = require("ora");
                console.log("");
                const spinner = ora({
                    text: `Making sure your database is configured correctly...`,
                    indent: 2
                }).start();

                const { MongoClient } = require("mongodb");
                try {
                    const connection = await MongoClient.connect(process.env.MONGODB_SERVER, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        connectTimeoutMS: 15000,
                        socketTimeoutMS: 15000,
                        serverSelectionTimeoutMS: 15000
                    });

                    // Let's immediately close the connection so we don't end up with a zombie connection.
                    await connection.close();
                    spinner.succeed(`Great! Your MongoDB is accessible.`);
                    console.log("");
                } catch (e) {
                    spinner.fail(
                        `Could not connect to the MongoDB server, make sure the connection string is correct and that the database server allows outside connections. Check https://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection for more information.`
                    );
                    process.exit(1);
                }
            }
        }

        componentContext._status.start();
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
        throw err;
    } finally {
        componentContext.clearStatus();
    }
};
