import invariant from "invariant";
import { createWatchApp, createBuildApp } from "@webiny/project-utils";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

const API_MAP = {
    REACT_APP_USER_POOL_REGION: "${region}",
    REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql",
    REACT_APP_API_URL: "${apiUrl}",
    REACT_APP_USER_POOL_ID: "${cognitoUserPoolId}",
    REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognitoAppClientId}",
    REACT_APP_USER_POOL_PASSWORD_POLICY: "${cognitoUserPoolPasswordPolicy}"
};

const NO_ENV_MESSAGE = `Please specify the environment via the "--env" argument, for example: "--env dev".`;
const NO_API_MESSAGE = env => {
    return `It seems that the API project application isn't deployed!\nBefore continuing, please deploy it by running the following command: yarn webiny deploy api --env=${env}`;
};

export default {
    commands: {
        async watch(options) {
            invariant(options.env, NO_ENV_MESSAGE);

            const output = getStackOutput({
                folder: "api",
                env: options.env,
                variant: options.variant,
                map: API_MAP
            });
            invariant(output, NO_API_MESSAGE(options.env));

            Object.assign(process.env, output);

            // Starts the local development server at port 3001.
            Object.assign(process.env, { PORT: options.port || 3001 });

            const watch = createWatchApp({ cwd: __dirname });
            await watch(options);
        },
        async build(options) {
            invariant(options.env, NO_ENV_MESSAGE);

            const output = getStackOutput({
                folder: "api",
                env: options.env,
                variant: options.variant,
                map: API_MAP
            });
            invariant(output, NO_API_MESSAGE(options.env));

            Object.assign(process.env, output);

            const build = createBuildApp({ cwd: __dirname });
            await build(options);
        }
    }
};
