import { Response, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

export const acceptIncomingChanges = () => {
    const plugin = new GraphQLSchemaPlugin<CmsContext>({
        typeDefs: /* GraphQL */ `
            extend type CmsMutation {
                acceptIncomingChanges(modelId: String!, entryId: String!): CmsBooleanResponse
            }
        `,
        resolvers: {
            CmsMutation: {
                acceptIncomingChanges: async () => {
                    return new Response(true);
                }
            }
        }
    });

    plugin.name = "graphql.schema.accept-incomming-changes";

    return plugin;
};
