import GraphQLLong from "graphql-type-long";
import { GraphQLDateTime } from "graphql-iso-date";
import { GraphQLScalarPlugin, GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import GraphQLJSON from "graphql-type-json";
import { RefInput } from "@webiny/handler-graphql/builtInTypes/RefInputScalar";
import { Number } from "@webiny/handler-graphql/builtInTypes/NumberScalar";
import { Any } from "@webiny/handler-graphql/builtInTypes/AnyScalar";

const baseSchema = (context: CmsContext): GraphQLSchemaPlugin => {
    const scalars = context.plugins
        .byType<GraphQLScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
                scalar JSON
                scalar Long
                scalar DateTime
                scalar RefInput
                scalar Number
                scalar Any

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
            `,
            resolvers: {
                ...scalars.reduce((acc, s) => {
                    acc[s.name] = s;
                    return acc;
                }, {}),
                JSON: GraphQLJSON,
                DateTime: GraphQLDateTime,
                Long: GraphQLLong,
                RefInput,
                Number,
                Any,
                Mutation: {
                    _empty: () => "_empty"
                }
            }
        }
    } as any;
};

export default baseSchema;
