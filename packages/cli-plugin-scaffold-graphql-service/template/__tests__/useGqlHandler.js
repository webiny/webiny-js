import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import myPlugins from "../src/plugins";

/**
 * The "useGqlHandler" is a simple handler that reflects the one created in "src/index.ts". The only
 * difference is that here we use a couple of different things. For example, instead of a real database
 * driver form Commodo, we use "neDB" driver (https://github.com/louischatriot/nedb/). We also expose
 * a couple of thing that you can use in your tests, like the "database" object and "invoke" function.
 */

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        neDb({ database }),
        apolloServerPlugins(),
        securityServicePlugins({
            token: {
                secret: "secret"
            }
        }),
        myPlugins()
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    // With the "handler" and "invoke" function, let's also return the "database", which will enable
    // us to do some manual database updating, for example, preparing the initial test data.
    return {
        database,
        handler,
        invoke
    };
};
