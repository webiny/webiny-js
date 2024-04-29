import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { createCmsGraphQLSchemaPlugin } from "~/index";
import { ACO_TEST_MODEL_ID } from "./model";
import { CmsContext } from "~/types";

const createUpdateLocationGraphQlPlugin = () => {
    const plugin = createCmsGraphQLSchemaPlugin<CmsContext>({
        typeDefs: /* GraphQL */ `
            type UpdateTestAcoModelLocationResponse {
                data: TestAcoModel
                error: CmsError
            }

            extend type Mutation {
                updateTestAcoModelLocation(
                    id: ID!
                    folderId: ID!
                ): UpdateTestAcoModelLocationResponse
            }
        `,
        resolvers: {
            Mutation: {
                updateTestAcoModelLocation: async (_, args, context) => {
                    return context.security.withoutAuthorization(async () => {
                        try {
                            const model = await context.cms.getModel(ACO_TEST_MODEL_ID);
                            if (!model) {
                                throw new Error(`Model "${ACO_TEST_MODEL_ID}" not found!`);
                            }
                            const entry = await context.cms.updateEntry(model, args.id, {
                                wbyAco_location: {
                                    folderId: args.folderId
                                }
                            });
                            return new Response(entry);
                        } catch (ex) {
                            return new ErrorResponse(ex);
                        }
                    });
                }
            }
        }
    });

    plugin.name = "headless-cms.graphqlCmsSchema.updateLocation";
    return plugin;
};

export const createUpdateLocationGraphQl = () => {
    return [createUpdateLocationGraphQlPlugin()];
};
