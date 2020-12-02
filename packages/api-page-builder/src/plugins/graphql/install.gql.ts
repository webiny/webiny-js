import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Response } from "@webiny/handler-graphql/responses";

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            input PbInstallInput {
                domain: String
                name: String!
            }
            type PbBooleanResponse {
                data: Boolean
                error: PbError
            }

            extend type PbQuery {
                # Is Page Builder installed?
                isInstalled: PbBooleanResponse
            }

            extend type PbMutation {
                # Install Page Builder (there are x steps because the process takes a long time).
                install(step: Int!, data: PbInstallInput!): PbBooleanResponse
            }
        `,
        resolvers: {
            PbQuery: {
                isInstalled: () => {
                    return new Response(true);
                }
            },
            PbMutation: {
                install: () => new Response(true)
            }
        }
    }
};

export default plugin;
