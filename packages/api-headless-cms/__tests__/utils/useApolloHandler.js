import { createHandler } from "@webiny/handler";
import httpHandlerApolloServerPlugins from "@webiny/handler-apollo-server";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";

const createApolloHandler = plugins =>
    createHandler(httpHandlerApolloServerPlugins(), plugins, headlessCmsPlugins());

export default plugins => () => {
    const apolloHandler = createApolloHandler(plugins);
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
