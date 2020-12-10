import { merge } from "lodash";
import contentModelGroup from "./graphql/contentModelGroup";
import contentModel from "./graphql/contentModel";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { CmsContext } from "@webiny/api-headless-cms/types";

const emptyResolver = () => ({});

export default ({ type }) => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type CmsQuery {
                    _empty: String
                }

                type CmsMutation {
                    _empty: String
                }

                extend type Query {
                    cms: CmsQuery
                }

                extend type Mutation {
                    cms: CmsMutation
                }

                type CmsError {
                    code: String
                    message: String
                    data: JSON
                }

                type CmsDeleteResponse {
                    data: Boolean
                    error: CmsError
                }
                ${contentModelGroup.getTypeDefs(type)}
                ${contentModel.typeDefs}
            `,
            resolvers: merge(
                {
                    _empty: emptyResolver
                },
                contentModelGroup.getResolvers(type),
                contentModel.resolvers
            )
        }
    } as GraphQLSchemaPlugin<CmsContext>
];
