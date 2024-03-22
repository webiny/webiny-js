import { GraphQLScalarPlugin } from "@webiny/handler-graphql/types";
import { CmsContext } from "~/types";
import {
    AnyScalar,
    DateScalar,
    DateTimeScalar,
    DateTimeZScalar,
    JsonScalar,
    LongScalar,
    NumberScalar,
    RefInputScalar,
    TimeScalar
} from "@webiny/handler-graphql/builtInTypes";
import { GraphQLScalarType } from "graphql";
import { createCmsGraphQLSchemaPlugin, ICmsGraphQLSchemaPlugin } from "~/plugins";

interface Params {
    context: CmsContext;
}

export const createBaseContentSchema = ({ context }: Params): ICmsGraphQLSchemaPlugin => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    const plugin = createCmsGraphQLSchemaPlugin({
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

            type CmsIdentity {
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
    plugin.name = `headless-cms.graphql.schema.baseContentSchema`;

    return plugin;
};
