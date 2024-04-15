import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { Context } from "../types";
import { GetApplicableContentRegions } from "../useCases/GetApplicableContentRegions";
import { createContentRegionsTypeDefs } from "./createContentRegionsTypeDefs";

export const createContentRegionsSchema = () => {
    const contentRegions = new GraphQLSchemaPlugin<Context>({
        typeDefs: createContentRegionsTypeDefs(),
        resolvers: {
            DemoQuery: {
                /**
                 * This resolver will filter content using company rules (culture groups, exclusion lists, regions).
                 */
                async getContentRegions(_, args, context) {
                    try {
                        return context.security.withoutAuthorization(async () => {
                            const useCase = new GetApplicableContentRegions(context);
                            const regions = await useCase.execute();

                            return new Response(regions);
                        });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    contentRegions.name = "demo.graphql.contentRegions";
    return [contentRegions];
};
