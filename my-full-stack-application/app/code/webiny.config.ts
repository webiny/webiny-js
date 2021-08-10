import invariant from "invariant";
import { startApp, buildApp } from "@webiny/project-utils";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

const MAP = {
    REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql",
    REACT_APP_API_URL: "${apiUrl}"
};

const NO_ENV_MESSAGE = `Please specify the environment via the "--env" argument, for example: "--env dev".`;

export default {
    commands: {
        async start(options, context) {
            invariant(options.env, NO_ENV_MESSAGE);

            const output = await getStackOutput("api", options.env, MAP);

            Object.assign(process.env, output);

            // Start local development
            await startApp(options, context);
        },
        async build(options, context) {
            invariant(options.env, NO_ENV_MESSAGE);

            const output = await getStackOutput("api", options.env, MAP);

            Object.assign(process.env, output);

            // Bundle app for deployment
            await buildApp(options, context);
        }
    }
};
