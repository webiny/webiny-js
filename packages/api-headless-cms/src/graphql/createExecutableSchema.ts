import { makeExecutableSchema } from "@graphql-tools/schema";
import { ICmsGraphQLSchemaPlugin } from "~/plugins";
import { ApiEndpoint } from "~/types";

interface Params {
    plugins: ICmsGraphQLSchemaPlugin[];
    endpoint: ApiEndpoint | null;
}

export const createExecutableSchema = (params: Params) => {
    const { plugins, endpoint } = params;
    /**
     * Really hard to type this to satisfy the makeExecutableSchema
     */
    // TODO @ts-refactor
    const typeDefs: any = [];
    const resolvers: any = [];

    // Get schema definitions from plugins
    for (const plugin of plugins) {
        if (plugin.canUse && plugin.canUse(endpoint) === false) {
            continue;
        }
        typeDefs.push(plugin.schema.typeDefs);
        resolvers.push(plugin.schema.resolvers);
    }

    return makeExecutableSchema({
        typeDefs,
        resolvers
    });
};
