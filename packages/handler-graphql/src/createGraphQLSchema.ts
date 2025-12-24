import gql from "graphql-tag";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import type { GraphQLScalarType } from "graphql/type/definition.js";
import type { GraphQLScalarPlugin, Resolvers, TypeDefs } from "./types.js";
import type { Context } from "@webiny/api/types.js";
import {
    RefInputScalar,
    NumberScalar,
    AnyScalar,
    DateScalar,
    DateTimeScalar,
    JsonScalar,
    TimeScalar,
    LongScalar
} from "./builtInTypes/index.js";
import { ResolverDecoration } from "./ResolverDecoration.js";
import type { GraphQLSchemaPlugin } from "~/plugins/index.js";
import { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import { GraphQLSchemaBuilderFeature } from "~/features/GraphQLSchemaBuilder/feature.js";

export const getSchemaPlugins = (context: Context) => {
    return context.plugins.byType<GraphQLSchemaPlugin>("graphql-schema").filter(pl => {
        if (typeof pl.isApplicable === "function") {
            return pl.isApplicable(context);
        }
        return true;
    });
};

export const createGraphQLSchema = async (context: Context) => {
    GraphQLSchemaBuilderFeature.register(context.container);

    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    const typeDefs: TypeDefs[] = [
        gql`
            type Query
            type Mutation
            ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
            scalar JSON
            scalar Long
            scalar RefInput
            scalar Number
            scalar Any
            scalar Date
            scalar DateTime
            scalar Time

            type Error {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type BooleanResponse {
                data: Boolean
                error: Error
            }
        `
    ];

    const resolvers: Resolvers<any>[] = [
        {
            ...scalars.reduce<Record<string, GraphQLScalarType>>((acc, s) => {
                acc[s.name] = s;
                return acc;
            }, {}),
            JSON: JsonScalar,
            Long: LongScalar,
            RefInput: RefInputScalar,
            Number: NumberScalar,
            Any: AnyScalar,
            DateTime: DateTimeScalar,
            Date: DateScalar,
            Time: TimeScalar
        }
    ];

    const resolverDecoration = new ResolverDecoration();

    // Process legacy plugins
    const plugins = getSchemaPlugins(context);

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

    // Process new DI implementations
    const graphQLSchemaBuilder = context.container.resolve(GraphQLSchemaBuilder);
    const schemaParts = await graphQLSchemaBuilder.build();

    typeDefs.push(schemaParts.typeDefs);
    resolvers.push(...schemaParts.resolvers);
    schemaParts.resolverDecorators.forEach(decorators => {
        resolverDecoration.addDecorators(decorators);
    });

    // Create executable schema
    return makeExecutableSchema({
        typeDefs,
        resolvers: resolverDecoration.decorateResolvers(mergeResolvers(resolvers)),
        inheritResolversFromInterfaces: true
    });
};
