import { createHandler } from "@webiny/http-handler";
import httpHandlerApolloServerPlugins from "@webiny/http-handler-apollo-server";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";
import commodoMongoDb from "@webiny/api-plugin-commodo-mongodb";

const COMMODO_MONGODB_OPTIONS = {
    database: {
        server: global.__MONGO_URI__,
        name: global.__MONGO_DB_NAME__
    }
};

const createApolloHandler = () =>
    createHandler(
        httpHandlerApolloServerPlugins(),
        commodoMongoDb(COMMODO_MONGODB_OPTIONS),
        headlessCmsPlugins()
    );

export default () => {
    const apolloHandler = createApolloHandler();
    return {
        apolloHandler,
        invoke: async ({ httpMethod = "POST", body }) => {
            const response = await apolloHandler({
                httpMethod: "POST",
                body: JSON.stringify(body)
            });

            return [JSON.parse(response.body), response];
        }
    };
};
