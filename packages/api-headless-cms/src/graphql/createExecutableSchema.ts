import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { ResolverDecoration } from "@webiny/handler-graphql";
import { Resolvers, TypeDefs } from "@webiny/handler-graphql/types";
import { ICmsGraphQLSchemaPlugin } from "~/plugins";

interface Params {
    plugins: ICmsGraphQLSchemaPlugin[];
}

export const createExecutableSchema = (params: Params) => {
    const { plugins } = params;

    const typeDefs: TypeDefs[] = [];
    const resolvers: Resolvers<any>[] = [];

    const resolverDecoration = new ResolverDecoration();

    // Get schema definitions from plugins
    for (const plugin of plugins) {
        const schema = plugin.schema;
        if (schema.typeDefs) {
            typeDefs.push(schema.typeDefs);
        }
        if (schema.resolvers) {
            resolvers.push(schema.resolvers);
        }
        if (schema.resolverDecorators) {
            resolverDecoration.addDecorators(schema.resolverDecorators);
        }
    }

    return makeExecutableSchema({
        typeDefs,
        resolvers: resolverDecoration.decorateResolvers(mergeResolvers(resolvers))
    });
};
