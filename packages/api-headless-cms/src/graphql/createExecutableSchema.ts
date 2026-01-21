import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { ResolverDecoration } from "@webiny/handler-graphql";
import type { Resolvers, TypeDefs } from "@webiny/handler-graphql/types.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { GraphQLField, GraphQLSchema } from "graphql";

interface Params {
    plugins: ICmsGraphQLSchemaPlugin[];
}

export const assertFieldDescriptionsAreStrings = (schema: GraphQLSchema): void => {
    const typeMap = schema.getTypeMap();

    for (const type of Object.values(typeMap)) {
        if (typeof (type as any).getFields !== "function") {
            continue;
        }

        const fields = (type as any).getFields() as Record<string, GraphQLField<any, any>>;
        for (const field of Object.values(fields)) {
            const desc = (field as any).description;
            if (desc !== null && desc !== undefined && typeof desc !== "string") {
                const message = `Invalid description type on ${type.name}.${field.name}: ${typeof desc}`;
                console.log(message);
                throw new Error(message);
            }
        }
    }
};

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

    const executableSchema = makeExecutableSchema({
        typeDefs,
        resolvers: resolverDecoration.decorateResolvers(mergeResolvers(resolvers))
    });
    assertFieldDescriptionsAreStrings(executableSchema);

    return executableSchema;
};
