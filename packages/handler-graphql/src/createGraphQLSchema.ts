import gql from "graphql-tag";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLScalarPlugin, GraphQLSchemaPlugin } from "./types";
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
import { GraphQLScalarType } from "graphql/type/definition";

export const getSchemaPlugins = (context: Context) => {
    return context.plugins.byType<GraphQLSchemaPlugin>("graphql-schema");
};

export const createGraphQLSchema = (context: Context) => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    // TODO: once the API packages more closed, we'll have the opportunity
    // TODO: to maybe import the @ps directive from `api-prerendering-service` package.
    const typeDefs = [
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

    const resolvers = [
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

    const plugins = getSchemaPlugins(context);
    for (const plugin of plugins) {
        /**
         * TODO @ts-refactor
         * Figure out correct types on typeDefs and resolvers
         */
        // @ts-expect-error
        typeDefs.push(plugin.schema.typeDefs);
        // @ts-expect-error
        resolvers.push(plugin.schema.resolvers);
    }

    return makeExecutableSchema({
        typeDefs,
        resolvers,
        inheritResolversFromInterfaces: true
    });
};
