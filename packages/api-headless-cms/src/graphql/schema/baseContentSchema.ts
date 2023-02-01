import { GraphQLScalarPlugin } from "@webiny/handler-graphql/types";
import { CmsContext } from "~/types";
import {
    RefInputScalar,
    NumberScalar,
    AnyScalar,
    DateTimeScalar,
    DateScalar,
    TimeScalar,
    LongScalar,
    JsonScalar,
    DateTimeZScalar
} from "@webiny/handler-graphql/builtInTypes";
import { GraphQLScalarType } from "graphql";
import { CmsGraphQLSchemaPlugin } from "~/plugins";

export const createBaseContentSchema = (context: CmsContext): CmsGraphQLSchemaPlugin => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    return new CmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
            scalar JSON
            scalar Long
            scalar RefInput
            scalar Number
            scalar Any
            scalar Date
            scalar DateTime
            scalar DateTimeZ
            scalar Time

            type Query

            type Mutation {
                _empty: String
            }

            type CmsCreatedBy {
                id: String
                displayName: String
                type: String
            }

            type CmsOwnedBy {
                id: String
                displayName: String
                type: String
            }

            enum CmsEntryStatusType {
                latest
                published
            }
        `,
        resolvers: {
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
            DateTimeZ: DateTimeZScalar,
            Date: DateScalar,
            Time: TimeScalar,
            Mutation: {
                _empty: () => "_empty"
            }
        }
    });
};
