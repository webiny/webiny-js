// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";

/* plugin-imports */
/* database */

import createConfig from "service-config";

const plugins = new PluginsContainer([servicePlugins, securityPlugins, headlessPlugins]);

let database = null;
async function init() {
    if (database && database.serverConfig.isConnected()) {
        return database;
    }

    const server = process.env.MONGODB_SERVER;
    const databaseName = process.env.MONGODB_DB_NAME;
    const client = await MongoClient.connect(server, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return client.db(databaseName);
}

let apolloHandler;

export const handler = async (event: Object, context: Object) => {
    if (!apolloHandler) {
        database = await init();
        const config = await createConfig();
        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
