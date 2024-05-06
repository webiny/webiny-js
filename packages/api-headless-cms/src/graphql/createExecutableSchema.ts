import { makeExecutableSchema } from "@graphql-tools/schema";
import { ICmsGraphQLSchemaPlugin } from "~/plugins";

interface Params {
    plugins: ICmsGraphQLSchemaPlugin[];
}

export const createExecutableSchema = (params: Params) => {
    const { plugins } = params;
    /**
     * Really hard to type this to satisfy the makeExecutableSchema
     */
    // TODO @ts-refactor
    const typeDefs: any = [];
    const resolvers: any = [];

    // Get schema definitions from plugins
    for (const plugin of plugins) {
        typeDefs.push(plugin.schema.typeDefs);
        resolvers.push(plugin.schema.resolvers);
    }

    return makeExecutableSchema({
        typeDefs,
        resolvers
    });
};
