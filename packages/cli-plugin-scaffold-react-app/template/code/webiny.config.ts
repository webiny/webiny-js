import { createWatchApp, createBuildApp } from "@webiny/project-utils";

// Exports fundamental watch and build commands.
// Need to inject environment variables or link your application with an existing GraphQL API?
// See https://www.webiny.com/docs/how-to-guides/scaffolding/react-application#linking-the-react-application-with-a-graphql-api.
export default {
    commands: {
        async watch(options) {
            // Starts the local development server at port 3002.
            Object.assign(process.env, { PORT: 3002 });

            // Starts local application development.
            const watch = createWatchApp({ cwd: __dirname });
            await watch(options);
        },
        async build(options) {
            // Creates a production build of your application, ready to be deployed to
            // a hosting provider of your choice, for example Amazon S3.
            const build = createBuildApp({ cwd: __dirname });
            await build(options);
        }
    }
};
