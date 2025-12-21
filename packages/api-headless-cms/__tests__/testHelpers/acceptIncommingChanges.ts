import { Response, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { CmsContext } from "~/types";

export const acceptIncomingChanges = () => {
    const plugin = new GraphQLSchemaPlugin<CmsContext>({
        typeDefs: /* GraphQL */ `
            extend type Mutation {
                acceptIncomingChanges(modelId: String!, entryId: String!): CmsBooleanResponse
            }
        `,
        resolvers: {
            Mutation: {
                acceptIncomingChanges: async () => {
                    return new Response(true);
                }
            }
        }
    });

    plugin.name = "graphql.schema.accept-incomming-changes";

    return plugin;
};
