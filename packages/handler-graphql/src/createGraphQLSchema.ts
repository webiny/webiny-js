import gql from "graphql-tag";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLScalarPlugin } from "./types";
import { HttpContext } from "@webiny/handler-http/types";
import {
    RefInput,
    Number as NumberScalar,
    Any as AnyScalar,
    DateScalar,
    DateTimeScalar,
    JsonScalar,
    TimeScalar,
    LongScalar
} from "./builtInTypes";

export const createGraphQLSchema = (context: HttpContext) => {
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
            scalar RefInput
            scalar Number
            scalar Any
            scalar Date
            scalar DateTime
            scalar Time
        `
    ];

    const resolvers = [
        {
            ...scalars.reduce((acc, s) => {
                acc[s.name] = s;
                return acc;
            }, {}),
            JSON: JsonScalar,
            Long: LongScalar,
            RefInput,
            Number: NumberScalar,
            Any: AnyScalar,
            DateTime: DateTimeScalar,
            Date: DateScalar,
            Time: TimeScalar
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
        resolvers,
        inheritResolversFromInterfaces: true
    });
};
