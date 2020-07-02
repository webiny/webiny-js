import useContentHandler from "./utils/useContentHandler";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Invalid type and environment URL params test", () => {
    /*
    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });*/
    it("should respond with proper error messages", async () => {
        const { invoke } = useContentHandler();
        let [body1] = await invoke({
            pathParameters: { key: "read123/xyz" }
        });

        expect(body1.error).toEqual({
            name: "Error",
            message:
                "Could not load environment, please check if the passed environment alias slug or environment ID is correct.",
            stack:
                "Error: Could not load environment, please check if the passed environment alias slug or environment ID is correct.\n    at apply (/Users/adrian/dev/webiny-js/packages/api-headless-cms/src/content/plugins/models.ts:68:19)\n    at applyContextPlugins (/Users/adrian/dev/webiny-js/packages/graphql/src/createSchema/contextPlugins.ts:13:13)\n    at prepareSchema (/Users/adrian/dev/webiny-js/packages/graphql/src/createSchema/prepareSchema.ts:20:5)\n    at Object.createSchema [as create] (/Users/adrian/dev/webiny-js/packages/graphql/src/createSchema.ts:21:31)\n    at createApolloHandler (/Users/adrian/dev/webiny-js/packages/api-headless-cms/src/content/apolloHandler/createApolloHandler.ts:37:24)\n    at Object.create (/Users/adrian/dev/webiny-js/packages/api-headless-cms/src/content/apolloHandler.ts:17:28)\n    at handle (/Users/adrian/dev/webiny-js/packages/handler-apollo-server/src/plugins/createHandlerApolloServer.ts:25:33)\n    at /Users/adrian/dev/webiny-js/packages/handler/src/middleware.ts:21:40"
        });

        let [body2] = await invoke({
            pathParameters: { key: "read/xyz" }
        });

        expect(body2.error).toEqual({
            name: "Error",
            message:
                "Could not load environment, please check if the passed environment alias slug or environment ID is correct.",
            stack:
                "Error: Could not load environment, please check if the passed environment alias slug or environment ID is correct.\n    at apply (/Users/adrian/dev/webiny-js/packages/api-headless-cms/src/content/plugins/models.ts:68:19)\n    at applyContextPlugins (/Users/adrian/dev/webiny-js/packages/graphql/src/createSchema/contextPlugins.ts:13:13)\n    at prepareSchema (/Users/adrian/dev/webiny-js/packages/graphql/src/createSchema/prepareSchema.ts:20:5)\n    at Object.createSchema [as create] (/Users/adrian/dev/webiny-js/packages/graphql/src/createSchema.ts:21:31)\n    at createApolloHandler (/Users/adrian/dev/webiny-js/packages/api-headless-cms/src/content/apolloHandler/createApolloHandler.ts:37:24)\n    at Object.create (/Users/adrian/dev/webiny-js/packages/api-headless-cms/src/content/apolloHandler.ts:17:28)\n    at handle (/Users/adrian/dev/webiny-js/packages/handler-apollo-server/src/plugins/createHandlerApolloServer.ts:25:33)\n    at /Users/adrian/dev/webiny-js/packages/handler/src/middleware.ts:21:40"
        });
    });
});
