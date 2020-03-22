import { PluginsContainer, CreateApolloHandlerPlugin } from "./types";
import createSchema from "./createSchema";

type CreateHandlerParams = {
    plugins: PluginsContainer;
};

/**
 * Create Apollo handler
 */
export default async function createHandler({ plugins }: CreateHandlerParams) {
    const { schema } = await createSchema({ plugins });

    const plugin = plugins.byName<CreateApolloHandlerPlugin>("create-apollo-handler");

    if (!plugin) {
        throw Error(`"create-apollo-handler" plugin is not configured!`);
    }

    const handler = await plugin.create({ plugins, schema });

    return { schema, handler };
}
