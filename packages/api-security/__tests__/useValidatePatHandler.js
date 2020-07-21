import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import accessTokenLambdaPlugins from "../src/validateAccessToken";

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    const handler = createHandler(neDb({ database }), accessTokenLambdaPlugins());

    const invoke = async payload => {
        return await handler(payload);
    };

    return {
        database,
        handler,
        invoke
    };
};
