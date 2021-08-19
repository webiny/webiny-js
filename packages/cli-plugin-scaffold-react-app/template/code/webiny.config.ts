import { startApp, buildApp } from "@webiny/project-utils";

// Exports fundamental watch and build commands.
// Need to inject environment variables or link your application with an existing GraphQL API?
// See https://www.webiny.com/docs/how-to-guides/scaffolding/react-application#linking-the-react-application-with-a-graphql-api.
export default {
    commands: {
        async watch(options, context) {
            // Starts local application development.
            await startApp(options, context);
        },
        async build(options, context) {
            // Creates a production build of your application, ready to be deployed to
            // a hosting provider of your choice, for example Amazon S3.
            await buildApp(options, context);
        }
    }
};
