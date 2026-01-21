import type { GraphQLScalarPlugin } from "@webiny/handler-graphql/types.js";
import type { CmsContext } from "~/types/index.js";
import {
    AnyScalar,
    DateScalar,
    DateTimeScalar,
    DateTimeZScalar,
    JsonScalar,
    LongScalar,
    NumberScalar,
    RefInputScalar,
    TimeScalar,
    IconScalar
} from "@webiny/handler-graphql/builtInTypes/index.js";
import type { GraphQLScalarType } from "graphql";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";

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
            scalar Icon

            type Query

            type Mutation {
                _empty: String
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
            Icon: IconScalar,
            Mutation: {
                _empty: () => "_empty"
            }
        }
    });
    plugin.name = `headless-cms.graphql.schema.baseContentSchema`;

    return plugin;
};
