import { GraphQLScalarPlugin } from "@webiny/handler-graphql/types";
import { CmsContext } from "~/types";
import {
    RefInput,
    Number as NumberScalar,
    Any as AnyScalar,
    DateTimeScalar,
    DateScalar,
    TimeScalar,
    LongScalar,
    JsonScalar,
    DateTimeZScalar
} from "@webiny/handler-graphql/builtInTypes";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

const baseSchema = (context: CmsContext): GraphQLSchemaPlugin => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    return new GraphQLSchemaPlugin({
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

            type CmsError {
                code: String
                message: String
                data: JSON
            }

            type CmsListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsBooleanResponse {
                data: Boolean
                error: CmsError
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
        `,
        resolvers: {
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
            DateTimeZ: DateTimeZScalar,
            Date: DateScalar,
            Time: TimeScalar,
            Mutation: {
                _empty: () => "_empty"
            }
        }
    });
};

export default baseSchema;
