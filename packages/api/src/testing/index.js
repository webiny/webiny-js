import { MongoClient } from "mongodb";
import { createHandler, PluginsContainer } from "../index";

export const setupSchema = async plugins => {
    // Setup database
    const client = await MongoClient.connect(global.__MONGO_URI__, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const config = { database: await client.db(global.__MONGO_DB_NAME__) };

    if (typeof plugins === "function") {
        plugins = plugins(config);
    }

    const pluginsContainer = new PluginsContainer([plugins]);

    const { schema } = await createHandler({ plugins: pluginsContainer, config });

    const context = { config, plugins: pluginsContainer };

    return {
        schema,
        context,
        tearDown: async () => {
            await client.close();
            await config.database.close();
        }
    };
};
