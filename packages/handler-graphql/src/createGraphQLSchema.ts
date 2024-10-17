import gql from "graphql-tag";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { GraphQLScalarType } from "graphql/type/definition";
import { GraphQLScalarPlugin, GraphQLSchemaPlugin, Resolvers, TypeDefs } from "./types";
import { Context } from "@webiny/api/types";
import {
    RefInputScalar,
    NumberScalar,
    AnyScalar,
    DateScalar,
    DateTimeScalar,
    JsonScalar,
    TimeScalar,
    LongScalar
} from "./builtInTypes";
import { ResolverDecoration } from "./ResolverDecoration";

export const getSchemaPlugins = (context: Context) => {
    return context.plugins.byType<GraphQLSchemaPlugin>("graphql-schema");
};

export const createGraphQLSchema = (context: Context) => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    // TODO: once the API packages are more closed, we'll have the opportunity
    // TODO: to maybe import the @ps directive from `api-prerendering-service` package.
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

            # This directive doesn't do anything on the GraphQL resolution level. It just serves
            # as a way to tell the Prerendering Service whether the GraphQL query needs to be
            # cached or not.
            directive @ps(cache: Boolean) on QUERY
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

    return makeExecutableSchema({
        typeDefs,
        resolvers: resolverDecoration.decorateResolvers(mergeResolvers(resolvers)),
        inheritResolversFromInterfaces: true
    });
};
