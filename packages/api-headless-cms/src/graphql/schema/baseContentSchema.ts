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
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { RevisionIdScalar } from "~/graphql/scalars/RevisionId.js";

export const createBaseContentSchema = (): ICmsGraphQLSchemaPlugin => {
    const plugin = createCmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            scalar RevisionId
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
            RevisionId: RevisionIdScalar,
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
