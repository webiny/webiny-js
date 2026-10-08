import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";
import { ErrorResponse, Response } from "@webiny/api-graphql";
import { createCmsGraphQLSchemaPlugin } from "~/index";
import { ACO_TEST_MODEL_ID } from "./model";
import type { CmsContext } from "~/types";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

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
                    return context.container
                        .resolve(IdentityContext)
                        .withoutAuthorization(async () => {
                            try {
                                const model = (
                                    await context.container
                                        .resolve(GetModelUseCase)
                                        .execute(ACO_TEST_MODEL_ID)
                                ).value;
                                if (!model) {
                                    throw new Error(`Model "${ACO_TEST_MODEL_ID}" not found!`);
                                }
                                const entry = (
                                    await context.container
                                        .resolve(UpdateEntryUseCase)
                                        .execute(model, args.id, {
                                            wbyAco_location: {
                                                folderId: args.folderId
                                            }
                                        })
                                ).value;
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
