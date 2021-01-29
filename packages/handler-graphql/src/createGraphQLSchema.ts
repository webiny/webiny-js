import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLScalarPlugin } from "@webiny/handler-graphql/types";
import gql from "graphql-tag";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLLong from "graphql-type-long";
import { Context } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { RefInput } from "./builtInTypes/RefInputScalar";
import { Number } from "./builtInTypes/NumberScalar";
import { Any } from "./builtInTypes/AnyScalar";

export const createGraphQLSchema = (context: Context<HttpContext>) => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    const typeDefs = [
        gql`
            type Query
            type Mutation
            ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
            scalar JSON
            scalar Long
            scalar DateTime
            scalar RefInput
            scalar Number
            scalar Any
        `
    ];

    const resolvers = [
        {
            ...scalars.reduce((acc, s) => {
                acc[s.name] = s;
                return acc;
            }, {}),
            JSON: GraphQLJSON,
            DateTime: GraphQLDateTime,
            Long: GraphQLLong,
            RefInput,
            Number,
            Any
        }
    ];

    const gqlPlugins = context.plugins.byType("graphql-schema");
    for (let i = 0; i < gqlPlugins.length; i++) {
        const plugin = gqlPlugins[i];
        typeDefs.push(plugin.schema.typeDefs);
        resolvers.push(plugin.schema.resolvers);
    }

    return makeExecutableSchema({
        typeDefs,
        resolvers
    });
};
