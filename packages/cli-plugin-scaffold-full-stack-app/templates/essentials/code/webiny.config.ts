import invariant from "invariant";
import { createWatchApp, createBuildApp } from "@webiny/project-utils";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

// Exports fundamental start (watch) and build commands.
// Within both commands, we rely on the deployed GraphQL API (project-applications-path/api) and its stack
// output to retrieve the URL over which the GraphQL API is accessible. If needed, additional
// information can be retrieved too, but remember to export it in the cloud infrastructure
// code, in the following files:
// - `project-applications-path/apps/api/pulumi/dev/index.ts`
// - `project-applications-path/apps/api/pulumi/prod/index.ts`

const API_MAP = {
    REACT_APP_API_URL: "${apiUrl}",
    REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql"
};

const NO_ENV_MESSAGE = `Please specify the environment via the "--env" argument, for example: "--env dev".`;
/**
 * TODO @ts-refactor @adrian
 * Figure out correct types for options.
 */
export default {
    commands: {
        // @ts-expect-error
        async watch(options) {
            invariant(options.env, NO_ENV_MESSAGE);
            Object.assign(
                process.env,
                getStackOutput({
                    folder: "project-applications-path/api",
                    env: options.env,
                    map: API_MAP
                })
            );

            // Starts the local development server at port 3000.
            Object.assign(process.env, { PORT: 3000 });

            // Starts local application development.
            const watch = createWatchApp({ cwd: __dirname });
            await watch(options);
        },
        // @ts-expect-error
        async build(options) {
            invariant(options.env, NO_ENV_MESSAGE);
            Object.assign(
                process.env,
                getStackOutput({
                    folder: "project-applications-path/api",
                    env: options.env,
                    map: API_MAP
                })
            );

            // Creates a production build of your application, ready to be deployed to
            // a hosting provider of your choice, for example Amazon S3.
            const build = createBuildApp({ cwd: __dirname });
            await build(options);
        }
    }
};
